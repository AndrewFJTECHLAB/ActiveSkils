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
    console.log('Starting extract-autres-experiences function');
    
    const { userId } = await req.json();
    console.log('User ID received:', userId);

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get documents data
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, title, markdown_content')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      throw docsError;
    }

    if (!documents || documents.length === 0) {
      throw new Error('No completed documents found');
    }

    console.log(`Processing ${documents.length} documents`);

    // Combine all document contents
    const combinedContent = documents.map(doc => 
      `=== Document: ${doc.title} ===\n${doc.markdown_content || ''}`
    ).join('\n\n');

    // Get prompt from database
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('prompt_text, system_message')
      .eq('name', 'extract-autres-experiences')
      .eq('active', true)
      .single();

    if (promptError || !promptData) {
      console.error('Error fetching prompt:', promptError);
      throw new Error('Failed to fetch extraction prompt');
    }

    // Extract autres experiences using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const extractionPrompt = promptData.prompt_text.replace('{documents}', combinedContent);

    console.log('Calling OpenAI API for autres experiences extraction');
    
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
            content: promptData.system_message
          },
          {
            role: 'user',
            content: extractionPrompt
          }
        ],
        max_completion_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('OpenAI response received');
    
    const extractedAutresExperiences = openAIData.choices[0].message.content;
    console.log('Extracted autres experiences:', extractedAutresExperiences);

    // Update user profile with extracted data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ extracted_autres_experiences_data: extractedAutresExperiences })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      throw new Error('Failed to update profile');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedAutresExperiences,
        documentsProcessed: documents.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );

  } catch (error) {
    console.error('Error in extract-autres-experiences function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});