import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { documentIds, prompt = "Analyse ces documents et fournis un résumé détaillé." } = await req.json();
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      throw new Error('documentIds array is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get documents data
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .in('id', documentIds)
      .eq('status', 'completed');

    if (fetchError) {
      throw new Error(`Failed to fetch documents: ${fetchError.message}`);
    }

    if (!documents || documents.length === 0) {
      throw new Error('No completed documents found with provided IDs');
    }

    // Collect markdown content from files
    let combinedContent = '';
    const documentSummaries = [];

    for (const document of documents) {
      if (document.markdown_file_path) {
        try {
          // Download markdown file from storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('documents')
            .download(document.markdown_file_path);

          if (downloadError) {
            console.error(`Failed to download markdown file for ${document.title}:`, downloadError);
            continue;
          }

          const markdownContent = await fileData.text();
          
          documentSummaries.push({
            title: document.title,
            type: document.document_type,
            filename: document.file_name
          });

          combinedContent += `\n\n## Document: ${document.title} (${document.document_type})\n`;
          combinedContent += `Fichier: ${document.file_name}\n\n`;
          combinedContent += markdownContent;
          
        } catch (error) {
          console.error(`Error processing document ${document.title}:`, error);
        }
      } else if (document.markdown_content) {
        // Fallback to database content if no file path
        documentSummaries.push({
          title: document.title,
          type: document.document_type,
          filename: document.file_name
        });

        combinedContent += `\n\n## Document: ${document.title} (${document.document_type})\n`;
        combinedContent += `Fichier: ${document.file_name}\n\n`;
        combinedContent += document.markdown_content;
      }
    }

    if (!combinedContent.trim()) {
      throw new Error('No markdown content found in selected documents');
    }

    console.log(`Processing ${documents.length} documents with combined content length: ${combinedContent.length} characters`);

    // Send to OpenAI API
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
            content: 'Tu es un assistant IA spécialisé dans l\'analyse de documents professionnels. Analyse les documents fournis et fournis des insights pertinents et structurés.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nVoici les documents à analyser :\n${combinedContent}`
          }
        ],
        max_completion_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    const analysis = openAIData.choices[0].message.content;

    console.log('OpenAI analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis,
        processedDocuments: documentSummaries,
        documentsCount: documents.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in openai-assistant function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});