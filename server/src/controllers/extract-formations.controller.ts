import { Request, Response, NextFunction, RequestHandler } from "express";
import { initPayload } from "../utils/utils";
import { DocumentsRepository } from "../Repository/documents.repository";
import { formationsPrompt } from "../Prompts/extraction/formations";
import { OpenAiRole } from "../types/enum";
import { OpenAiMessages } from "../types/type";
import { callOpenAi } from "../lib/openAi";

const initRepository = (req: Request, res: Response, next: NextFunction) => {
  const documentRepo = new DocumentsRepository();

  req.payload.documentRepo = documentRepo;

  next();
};

const validateRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { documentIds } = req.body;

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).send({
      error: "documentIds is required and must be a non-empty array",
    });
  }

  req.payload.documentIds = documentIds;
  next();
};

const fetchDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    documentRepo,
    documentIds,
  }: { documentRepo: DocumentsRepository; documentIds: string[] } = req.payload;

  try {
    const documents = await documentRepo.getDocuments(documentIds);

    if (!documents || documents.length === 0) {
      return res.status(500).send("No completed documents found");
    }
    req.payload.documents = documents;
  } catch (error) {
    console.log("An error occurred while fetching documents", error);
    return res.status(500).send("An error occurred while fetching documents");
  }

  next();
};

const combineMarkdown = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    documents,
    documentRepo,
  }: { documents: any[]; documentRepo: DocumentsRepository } = req.payload;

  let combinedContent = "";

  for (const doc of documents) {
    combinedContent += `\n\n=== DOCUMENT: ${doc.title} (${doc.document_type}) ===\n`;

    if (doc.markdown_content) {
      combinedContent += doc.markdown_content;
    } else if (doc.markdown_file_path) {
      try {
        const file = await documentRepo.getDocumentFromStorage(
          doc.markdown_file_path
        );

        const fileContent = await file.text();
        combinedContent += fileContent;
      } catch (err) {
        console.error("Error processing file:", err);
        combinedContent += `[Erreur lors du traitement du fichier: ${doc.markdown_file_path}]`;
      }
    } else {
      combinedContent += "[Aucun contenu disponible pour ce document]";
    }
  }

  req.payload.combinedContent = combinedContent;
  next();
};

const preparePrompt = (req: Request, res: Response, next: NextFunction) => {
  const { combinedContent } = req.payload;

  const prompt = formationsPrompt(combinedContent);

  req.payload.prompt = prompt;
  next();
};

const processWithOpenAi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { prompt } = req.payload;

  const messages: OpenAiMessages[] = [
    {
      role: OpenAiRole.SYSTEM,
      content:
        "Tu es un expert en analyse de CV et documents professionnels. Tu extrais uniquement les informations de formation demandées au format JSON strict.",
    },
    {
      role: OpenAiRole.USER,
      content: prompt,
    },
  ];

  const data = await callOpenAi({ messages });

  if (!data.choices || data.choices.length === 0) {
    return res.status(500).send("Invalid OpenAI response");
  }

  req.payload.extractedData = data.choices[0].message.content;
  next();
};

const sendResult = (req: Request, res: Response) => {
  const { documents, extractedData } = req.payload;

  return res.status(200).json({
    success: true,
    extractedData,
    documentsCount: documents.length,
    processedDocuments: documents.map((d: any) => ({
      id: d.id,
      title: d.title,
      type: d.document_type,
    })),
  });
};

export const extractFormations = (): RequestHandler[] => [
  initPayload,
  initRepository,
  validateRequest,
  fetchDocuments,
  combineMarkdown,
  preparePrompt,
  processWithOpenAi,
  sendResult,
];
