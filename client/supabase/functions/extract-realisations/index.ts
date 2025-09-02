import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    console.log('Starting realizations extraction for user:', userId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's documents
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('markdown_content', 'is', null);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      throw new Error('Failed to fetch documents');
    }

    if (!documents || documents.length === 0) {
      throw new Error('No processed documents found');
    }

    console.log(`Found ${documents.length} documents for analysis`);

    // Combine all document contents
    const combinedContent = documents
      .map(doc => `Document: ${doc.title}\n${doc.markdown_content}`)
      .join('\n\n---\n\n');

    // Get prompt from database
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('prompt_text, system_message')
      .eq('name', 'extract-realisations')
      .eq('active', true)
      .single();

    if (promptError || !promptData) {
      console.error('Error fetching prompt:', promptError);
      throw new Error('Failed to fetch extraction prompt');
    }

    const prompt = promptData.prompt_text.replace('{documents}', combinedContent);

    console.log('Calling OpenAI API for realizations extraction...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: promptData.system_message
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const extractedData = data.choices[0].message.content;

    console.log('OpenAI response received, updating profile...');

    // Update user profile with extracted realizations data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ extracted_realisations_data: extractedData })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error('Failed to update profile');
    }

    console.log('Profile updated successfully with realizations data');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        message: 'Réalisations extraites avec succès'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-realisations function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});