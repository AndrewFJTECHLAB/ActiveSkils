import { Request, Response, NextFunction, RequestHandler } from "express";
import { initPayload } from "../utils/utils";
import { DocumentsRepository } from "../Repository/documents.repository";
import { OpenAiMessages, ProfileRepository, PromptRepository } from "../types/type";
import { OpenAiRole, Prompts } from "../types/enum";
import { callOpenAi } from "../lib/openAi";
import { ProfilesRepository } from "../Repository/profiles.repository";
import { PromptsRepository } from "../Repository/prompts.repository";

const initRepositories = (req: Request, res: Response, next: NextFunction) => {
  const documentRepo = new DocumentsRepository();
  const profileRepo = new ProfilesRepository();
  const promptRepo = new PromptsRepository()

  req.payload.documentRepo = documentRepo;
  req.payload.profileRepo = profileRepo;
  req.payload.promptRepo = promptRepo

  next();
};

const validateRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send({
      error: "UserId is required",
    });
  }

  req.payload.userId = userId;
  next();
};

const fetchDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    documentRepo,
    userId,
  }: { documentRepo: DocumentsRepository; userId: string } = req.payload;

  try {
    const documents = await documentRepo.getDocumentsByUserId(userId);

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
  }: { documents: any[]; } = req.payload;

  const combinedContent = documents.map(doc => 
      `=== Document: ${doc.title} ===\n${doc.markdown_content || ''}`
    ).join('\n\n');

  req.payload.combinedContent = combinedContent;
  next();
};

const preparePrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    combinedContent,
    promptRepo,
  }: { combinedContent: string; promptRepo: PromptRepository } = req.payload;

  const promptData: any = await promptRepo.getPromptByName(
    Prompts.REALISATIONS
  );

  const prompt = promptData.prompt_text.replace("{documents}", combinedContent);

  req.payload.promptId = promptData.id;
  req.payload.userPrompt = prompt;
  req.payload.systemPrompt = promptData.system_message;
  next();
};

const processWithOpenAi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userPrompt, systemPrompt } = req.payload;

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

export const extractRealisations = (): RequestHandler[] => [
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
