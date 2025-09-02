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
    
    if (!documentIds || !Array.isArray(documentIds)) {
      return new Response(
        JSON.stringify({ error: 'Document IDs are required and must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey) {
      console.error('OpenAI API key not found');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found');
      return new Response(
        JSON.stringify({ error: 'Supabase credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch documents
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .in('id', documentIds)
      .eq('status', 'completed');

    if (fetchError) {
      console.error('Error fetching documents:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch documents' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No completed documents found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine markdown content from all documents
    let combinedContent = '';
    for (const doc of documents) {
      let content = '';
      
      if (doc.markdown_content) {
        content = doc.markdown_content;
      } else if (doc.markdown_file_path) {
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('documents')
            .download(doc.markdown_file_path);
          
          if (downloadError) {
            console.error(`Error downloading markdown for document ${doc.id}:`, downloadError);
            continue;
          }
          
          content = await fileData.text();
        } catch (error) {
          console.error(`Error reading markdown content for document ${doc.id}:`, error);
          continue;
        }
      }
      
      if (content) {
        combinedContent += `\n\n--- Document: ${doc.title} ---\n${content}`;
      }
    }

    if (!combinedContent.trim()) {
      return new Response(
        JSON.stringify({ error: 'No readable content found in documents' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Tableau simplifié et chronologique des expériences professionnelles
Nom de l'entreprise
Titre du poste
Date de début 
Date de fin
⚠️ Ne pas regrouper les expériences ; mentionner les évolutions internes distinctement.

Retourne UNIQUEMENT un JSON avec cette structure, classé par ordre chronologique (plus récent en premier) :
[
  {
    "entreprise": "",
    "titre_poste": "",
    "date_debut": "",
    "date_fin": ""
  }
]

Instructions :
- Si une information n'est pas trouvée, laisse le champ vide ""
- Pour les dates : utilise le format "MM/YYYY" ou "YYYY" selon les informations disponibles
- Pour la date de fin : si c'est le poste actuel, mettre "Présent" ou "En cours"
- Sépare distinctement chaque évolution de poste même dans la même entreprise
- Classe par ordre chronologique inversé (plus récent d'abord)
- Retourne UNIQUEMENT le JSON, aucun autre texte

Documents à analyser :
${combinedContent}`;

    console.log('Sending request to OpenAI...');
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
            content: 'Tu es un expert en analyse de CV et documents professionnels. Tu extrais uniquement les informations d\'expérience professionnelle demandées au format JSON strict.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 2000,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to get response from OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIData = await openAIResponse.json();
    const extractedParcours = openAIData.choices[0].message.content;
    
    console.log('Extracted parcours professionnel:', extractedParcours);

    return new Response(
      JSON.stringify({
        success: true,
        extractedParcours,
        documentsProcessed: documents.length,
        documentTitles: documents.map(d => d.title)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in extract-parcours-professionnel function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});