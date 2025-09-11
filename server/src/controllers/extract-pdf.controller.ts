import { Request, Response, NextFunction, RequestHandler } from "express";
import { initPayload } from "../utils/utils";
import { DocumentsRepository } from "../Repository/documents.repository";
import { DOCUMENT_STATUS, OCR_JOB_STATUS } from "../types/enum";

const initRepository = (req: Request, res: Response, next: NextFunction) => {
  const documentRepo = new DocumentsRepository();

  req.payload.documentRepo = documentRepo;

  next();
};

const updateFileStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { documentRepo }: { documentRepo: DocumentRepository } = req.payload;
  const filePath = req.body.filePath;

  if (!filePath) {
    res.status(400).send();
  }

  try {
    await documentRepo.updateDocument(filePath, {
      status: DOCUMENT_STATUS.PROCESSING,
    });
  } catch (error) {
    console.error("Error occurred wile updating doc status", error);
    return res.status(500).send("Error occurred while updating doc status");
  }

  next();
};

const getFileUrl = async (req: Request, res: Response, next: NextFunction) => {
  const filePath = req.body.filePath;
  const { documentRepo }: { documentRepo: DocumentRepository } = req.payload;

  console.log("🟩 Starting OCR extraction");

  try {
    const signedUrl = await documentRepo.getSignedUrl(filePath);

    req.payload.fileUrl = signedUrl;
  } catch (error) {
    console.log("Ocr error while processing file: ", error);
    return res.status(500).send("Error occurred wile processing file");
  }

  next();
};

const setOcrApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const key = process.env.FJSOFTLAB_OCR_API_KEY;

  if (!key) throw new Error("FJSOFTLAB_OCR_API_KEY is missing");

  req.payload.ocrApiKey = key;

  next();
};

const startOcrJob = async (req: Request, res: Response, next: NextFunction) => {
  const { fileUrl, ocrApiKey }: { fileUrl: string; ocrApiKey: string } =
    req.payload;

  const apiUrls = [
    "https://ocr.fjsoftlab.com/api/v1/ocr",
    "https://ocr.fjsoftlab.com/api/V1/ocr",
  ];

  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-authentication": ocrApiKey,
    },
    body: JSON.stringify({ url: fileUrl }),
  };

  for (const url of apiUrls) {
    const response = await fetch(url, options);

    if (response.ok) {
      const result = await response.json();

      const jobId = result.job_id || result.id;

      if (!jobId) {
        return res
          .status(500)
          .send(`Ocr processing failed: No job id returned`);
      }

      req.payload.jobId = jobId;
      return next();
    }

    console.log(
      "OCR processing failed for: ",
      url,
      " with message ",
      await response.text()
    );
  }

  return res.status(500).send(`Ocr processing failed`);
};

const pollForJobCompletion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { jobId, ocrApiKey }: { jobId: string; ocrApiKey: string } =
    req.payload;

  const MAX_ATTEMPTS = 60;
  const ATTEMPT_WAIT_TIME = 5000; // 5 sec

  let status = OCR_JOB_STATUS.QUEUED;
  let attempts = 0;

  while (status == OCR_JOB_STATUS.QUEUED && attempts < MAX_ATTEMPTS) {
    await new Promise((resolve) => setTimeout(resolve, ATTEMPT_WAIT_TIME));
    attempts++;

    const response = await fetch(
      `https://ocr.fjsoftlab.com/api/v1/status/${jobId}`,
      {
        headers: {
          "x-authentication": ocrApiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OCR status check failed: ${response.status}`);
    }

    const result = await response.json();
    status = (result.status?.toLowerCase?.() ?? result.status ?? "").toString();
  }

  switch (status) {
    case OCR_JOB_STATUS.FAILED:
      throw new Error("OCR processing failed with status: failed");
    case OCR_JOB_STATUS.QUEUED:
      throw new Error(`OCR processing timeout after ${attempts} attempts`);
  }

  next();
};

const getMarkdownResult = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { jobId, ocrApiKey }: { jobId: string; ocrApiKey: string } =
    req.payload;

  const result = await fetch(
    `https://ocr.fjsoftlab.com/api/v1/result/${jobId}`,
    {
      headers: {
        "x-authentication": ocrApiKey,
      },
    }
  );

  if (!result.ok) {
    throw new Error(
      `OCR result retrieval error: ${result.status} - ${await result.text()}`
    );
  }

  const rawResults = await result.text();
  let md = rawResults;

  try {
    const parsedResult = JSON.parse(rawResults);
    if (parsedResult && typeof parsedResult == "object") {
      md =
        parsedResult.markdown ||
        parsedResult.content ||
        parsedResult.text ||
        "";
    }
  } catch (error) {
    console.log("Markdown is a text");
  }

  if (!md || md == "") {
    req.payload.extractionError = "Erreur lors de l'extraction avec OCR";
    throw new Error("Empty markdown returned from OCR result");
  }

  req.payload.markdownContent = md;
  next();
};

const storeMarkdown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    documentRepo,
  }: { markdown: string; documentRepo: DocumentsRepository } = req.payload;
  const filePath = req.body.filePath;

  const originalDocData: any = await documentRepo.getDocumentData(
    filePath,
    "file_name, user_id"
  );

  if (!originalDocData) {
    throw new Error("Data from original documents could not be retrieved");
  }

  const markdownFileName = originalDocData.file_name.replace(".pdf", ",md");

  const markdownFilePath = `${originalDocData.user_id}/markdowns/${markdownFileName}`;

  req.payload.markdownFilePath = markdownFilePath;

  next();
};

const uploadMarkdownAsFile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    markdownFilePath,
    markdownContent,
    documentRepo,
  }: {
    markdownFilePath: string;
    markdownContent: string;
    documentRepo: DocumentsRepository;
  } = req.payload;

  const content = new Blob([markdownContent], { type: "text/markdown" });

  try {
    await documentRepo.uploadMarkdown(markdownFilePath, content);
  } catch (error) {
    console.error("Error occurred wile saving markdown", error);
    return res.status(500).send("Error occurred while saving markdown");
  }

  next();
};

const finalDocumentUpdate = async (req: Request, res: Response) => {
  const {
    markdownFilePath,
    markdownContent,
    extractionError,
    documentRepo,
  }: {
    markdownFilePath: string;
    markdownContent: string;
    extractionError: string;
    documentRepo: DocumentsRepository;
  } = req.payload;
  const filePath = req.body.filePath;

  try {
    await documentRepo.updateDocument(filePath, {
      status: extractionError
        ? DOCUMENT_STATUS.ERROR
        : DOCUMENT_STATUS.COMPLETED,
      markdown_content: markdownContent,
      markdown_file_path: markdownFilePath,
      extraction_error: extractionError,
    });

    console.log("✅ CCR extraction completed");

    return res.status(200).send({
      success: true,
      markdownContent,
      extractionError,
    });
  } catch (error) {
    console.log("Failed to update document with markdown data");
    return res.status(500);
  }
};

export const extractPdf = (): RequestHandler[] => [
  initPayload,
  initRepository,
  updateFileStatus,
  getFileUrl,
  setOcrApiKey,
  startOcrJob,
  pollForJobCompletion,
  getMarkdownResult,
  storeMarkdown,
  uploadMarkdownAsFile,
  finalDocumentUpdate,
];
