import { Request, Response, NextFunction, RequestHandler } from "express";
import { initPayload } from "../utils/utils";
import { DocumentsRepository } from "../Repository/documents.repository";
import {
  OpenAiMessages,
  ProfileRepository,
  PromptRepository,
} from "../types/type";
import { OpenAiRole, Prompts } from "../types/enum";
import { callOpenAi } from "../lib/openAi";
import { ProfilesRepository } from "../Repository/profiles.repository";
import { PromptsRepository } from "../Repository/prompts.repository";

const initRepositories = (req: Request, res: Response, next: NextFunction) => {
  const documentRepo = new DocumentsRepository();
  const profileRepo = new ProfilesRepository();
  const promptRepo = new PromptsRepository();

  req.payload.documentRepo = documentRepo;
  req.payload.profileRepo = profileRepo;
  req.payload.promptRepo = promptRepo;

  next();
};

const validateRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    documentIds,
    userId,
    prompt = "Analyse ces documents et fournis un résumé détaillé.",
  } = req.body;

  if (!userId) {
    return res.status(400).send({
      error: "userId is required",
    });
  }

  if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
    return res.status(400).send({
      error: "DocumentIds are required",
    });
  }

  req.payload.documentIds = documentIds;
  req.payload.userId = userId;
  req.payload.prompt = prompt;
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
  const documentSummaries = [];

  for (const document of documents) {
    if (document.markdown_file_path) {
      try {
        const fileData = await documentRepo.getDocumentFromStorage(
          document.markdown_file_path
        );

        const markdownContent = await fileData.text();

        documentSummaries.push({
          title: document.title,
          type: document.document_type,
          filename: document.file_name,
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
        filename: document.file_name,
      });

      combinedContent += `\n\n## Document: ${document.title} (${document.document_type})\n`;
      combinedContent += `Fichier: ${document.file_name}\n\n`;
      combinedContent += document.markdown_content;
    }
  }

  req.payload.combinedContent = combinedContent;
  req.payload.documentSummaries = documentSummaries;
  next();
};

const preparePrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    promptRepo,
    prompt,
    combinedContent,
  }: { combinedContent: string; promptRepo: PromptRepository; prompt: string } =
    req.payload;

  const promptData: any = await promptRepo.getPromptByName(
    Prompts.OPENAI_ASSISTANT
  );

  const userPrompt = `${prompt}\n\n${promptData.prompt_text.replace("{documents}", combinedContent)}`;

  req.payload.promptId = promptData.id;
  req.payload.userPrompt = userPrompt;
  req.payload.systemPrompt = promptData.system_message;

  next();
};

const processWithOpenAi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { systemPrompt, userPrompt } = req.payload;

  const messages: OpenAiMessages[] = [
    {
      role: OpenAiRole.SYSTEM,
      content: systemPrompt,
    },
    {
      role: OpenAiRole.USER,
      content: userPrompt,
    },
  ];

  const data = await callOpenAi({ messages });

  if (!data.choices || data.choices.length === 0) {
    return res.status(500).send("Invalid OpenAI response");
  }

  req.payload.extractedData = data.choices[0].message.content;
  next();
};

const saveResult = async (req: Request, res: Response, next: NextFunction) => {
  const {
    promptId,
    extractedData,
    userId,
    promptRepo,
  }: {
    userId: string;
    promptId: string;
    extractedData: string;
    promptRepo: PromptRepository;
  } = req.payload;

  await promptRepo.savePromptResult({
    userId,
    promptId,
    value: extractedData,
  });

  next();
};

const sendResult = (req: Request, res: Response) => {
  const { documents, documentSummaries } = req.payload;

  return res.status(200).json({
    success: true,
    documentsCount: documents.length,
    processedDocuments: documentSummaries,
  });
};

export const openAiAssistant = (): RequestHandler[] => [
  initPayload,
  initRepositories,
  validateRequest,
  fetchDocuments,
  combineMarkdown,
  preparePrompt,
  processWithOpenAi,
  saveResult,
  sendResult,
];
