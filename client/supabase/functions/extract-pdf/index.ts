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
    const { filePath } = await req.json();
    
    if (!filePath) {
      throw new Error('filePath is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update document status to processing
    const { error: updateStatusError } = await supabase
      .from('documents')
      .update({ status: 'processing' })
      .eq('file_path', filePath);

    if (updateStatusError) {
      console.error('Error updating status:', updateStatusError);
    }

    // Using signed URL for OCR API fetch; no need to download the file here

    // Extract PDF to markdown using fjsoftlab OCR API
    let markdownContent: string | null = '';
    let extractionError: string | null = null;

    try {
      const ocrApiKey = Deno.env.get('FJSOFTLAB_OCR_API_KEY');
      
      if (!ocrApiKey) {
        throw new Error('FJSOFTLAB_OCR_API_KEY not configured');
      }

      console.log('Starting OCR extraction for:', filePath);
      
      // Create a signed URL so the OCR API can fetch the file directly
      const { data: signedData, error: signedUrlError } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(filePath, 600); // valid for 10 minutes

      if (signedUrlError || !signedData?.signedUrl) {
        throw new Error(`Failed to create signed URL: ${signedUrlError?.message}`);
      }

      const fileUrl = signedData.signedUrl;

      // Helper to start OCR job, trying lowercase then uppercase API version just in case
      async function startOcrJob() {
        const body = JSON.stringify({ url: fileUrl });
        const commonOptions: RequestInit = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-authentication': ocrApiKey,
          },
          body,
        };

        let res = await fetch('https://ocr.fjsoftlab.com/api/v1/ocr', commonOptions);
        if (res.status === 404) {
          // Try capital V fallback
          res = await fetch('https://ocr.fjsoftlab.com/api/V1/ocr', commonOptions);
        }
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`OCR upload error: ${res.status} - ${txt}`);
        }
        return res.json();
      }

      // Step 1: Upload URL to OCR API
      const uploadResult = await startOcrJob();
      console.log('OCR upload response:', JSON.stringify(uploadResult, null, 2));

      const jobId = uploadResult.job_id || uploadResult.id;
      if (!jobId) {
        throw new Error('No job_id returned from OCR upload');
      }

      console.log('OCR job ID:', jobId);

      // Step 2: Poll for job completion
      let jobStatus: string = 'queued';
      let attempts = 0;
      const maxAttempts = 60; // Wait up to 5 minutes (5 second intervals)

      while (jobStatus !== 'completed' && jobStatus !== 'failed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;

        const statusResponse = await fetch(`https://ocr.fjsoftlab.com/api/v1/status/${jobId}`, {
          headers: {
            'x-authentication': ocrApiKey,
          },
        });

        if (!statusResponse.ok) {
          throw new Error(`OCR status check error: ${statusResponse.status}`);
        }

        const statusResult = await statusResponse.json();
        jobStatus = (statusResult.status?.toLowerCase?.() ?? statusResult.status ?? '').toString();
        console.log(`OCR job status (attempt ${attempts}):`, jobStatus);
      }

      if (jobStatus === 'failed') {
        throw new Error('OCR processing failed with status: failed');
      }

      if (jobStatus !== 'completed') {
        throw new Error(`OCR processing timeout after ${attempts} attempts`);
      }

      // Step 3: Retrieve the markdown result
      const resultResponse = await fetch(`https://ocr.fjsoftlab.com/api/v1/result/${jobId}`, {
        headers: {
          'x-authentication': ocrApiKey,
        },
      });

      if (!resultResponse.ok) {
        const txt = await resultResponse.text();
        throw new Error(`OCR result retrieval error: ${resultResponse.status} - ${txt}`);
      }

      const rawResult = await resultResponse.text();
      let md = rawResult;
      // Try to parse as JSON if needed and extract a markdown-like field
      try {
        const maybeJson = JSON.parse(rawResult);
        if (maybeJson && typeof maybeJson === 'object') {
          md = maybeJson.markdown || maybeJson.content || maybeJson.text || '';
        }
      } catch (_) {
        // Not JSON, keep as raw text
      }

      if (!md) {
        throw new Error('Empty markdown returned from OCR result');
      }

      markdownContent = md;
      console.log('Successfully extracted markdown with OCR, length:', markdownContent.length);

    } catch (error: any) {
      console.error('OCR extraction error:', error);
      extractionError = `Erreur lors de l'extraction avec OCR: ${error.message}`;
      markdownContent = null;
    }

    // Store markdown content as a file in storage
    let markdownFilePath: string | null = null;
    if (markdownContent && !extractionError) {
      try {
        // Get document info to use original filename
        const { data: docData } = await supabase
          .from('documents')
          .select('file_name, user_id')
          .eq('file_path', filePath)
          .single();

        if (docData) {
          const markdownFileName = docData.file_name.replace('.pdf', '.md');
          markdownFilePath = `${docData.user_id}/markdowns/${markdownFileName}`;
          
          // Upload markdown content as a file
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(markdownFilePath, new Blob([markdownContent], { type: 'text/markdown' }), {
              contentType: 'text/markdown'
            });

          if (uploadError) {
            console.error('Error storing markdown file:', uploadError);
            markdownFilePath = null;
          } else {
            console.log('Markdown file stored at:', markdownFilePath);
          }
        }
      } catch (error) {
        console.error('Error creating markdown file:', error);
        markdownFilePath = null;
      }
    }

    // Update document with extracted content and markdown file path
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: extractionError ? 'error' : 'completed',
        markdown_content: markdownContent,
        extraction_error: extractionError,
        markdown_file_path: markdownFilePath
      })
      .eq('file_path', filePath);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        markdownContent,
        extractionError 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in extract-pdf function:', error);
    
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