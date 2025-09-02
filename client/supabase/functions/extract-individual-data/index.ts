import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentIds } = await req.json();
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'documentIds is required and must be a non-empty array' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get environment variables
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch documents
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .in('id', documentIds)
      .eq('status', 'completed');

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch documents' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No completed documents found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Combine markdown content from all documents
    let combinedContent = '';
    
    for (const document of documents) {
      combinedContent += `\n\n=== DOCUMENT: ${document.title} (${document.document_type}) ===\n`;
      
      if (document.markdown_content) {
        combinedContent += document.markdown_content;
      } else if (document.markdown_file_path) {
        try {
          const { data: fileData, error: fileError } = await supabase.storage
            .from('documents')
            .download(document.markdown_file_path);
          
          if (fileError) {
            console.error('Error downloading file:', fileError);
            combinedContent += `[Erreur lors du téléchargement du fichier: ${document.markdown_file_path}]`;
          } else {
            const fileContent = await fileData.text();
            combinedContent += fileContent;
          }
        } catch (error) {
          console.error('Error processing file:', error);
          combinedContent += `[Erreur lors du traitement du fichier: ${document.markdown_file_path}]`;
        }
      } else {
        combinedContent += '[Aucun contenu disponible pour ce document]';
      }
    }

    // Prepare the prompt for individual data extraction
    const extractionPrompt = `Analyse les documents suivants et extrais UNIQUEMENT les informations personnelles suivantes au format JSON strict :

{
  "nom": "",
  "prenom": "",
  "email": "",
  "age": "",
  "linkedin_url": "",
  "lieu_residence": "",
  "annees_experience": ""
}

Instructions :
- Si une information n'est pas trouvée ou n'est pas déductible, laisse le champ vide ""
- Pour l'âge : si la date de naissance est présente, calcule l'âge, sinon cherche s'il est mentionné directement
- Pour les années d'expérience : compte le nombre total d'années d'expérience professionnelle
- Pour LinkedIn : cherche une URL LinkedIn complète
- Pour le lieu de résidence : cherche l'adresse actuelle ou la ville de résidence
- Retourne UNIQUEMENT le JSON, aucun autre texte

Documents à analyser :
${combinedContent}`;

    console.log('Sending request to OpenAI with extraction prompt');

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant spécialisé dans l\'extraction de données personnelles à partir de documents. Tu dois retourner uniquement du JSON valide.'
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        max_completion_tokens: 1000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'OpenAI API request failed' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const openAIData = await openAIResponse.json();
    
    if (!openAIData.choices || openAIData.choices.length === 0) {
      console.error('No choices in OpenAI response');
      return new Response(
        JSON.stringify({ error: 'Invalid OpenAI response' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const extractedData = openAIData.choices[0].message.content;
    console.log('Extracted individual data:', extractedData);

    return new Response(
      JSON.stringify({
        success: true,
        extractedData: extractedData,
        documentsCount: documents.length,
        processedDocuments: documents.map(d => ({
          id: d.id,
          title: d.title,
          type: d.document_type
        }))
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in extract-individual-data function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});