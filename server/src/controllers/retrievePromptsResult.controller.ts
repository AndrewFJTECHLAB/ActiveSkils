import { Request, Response, NextFunction, RequestHandler } from "express";
import { initPayload } from "../utils/utils";
import { PromptsRepository } from "../Repository/prompts.repository";
import { PromptRepository } from "../types/type";

const initRepository =  (req: Request, res:Response, next:NextFunction) => {
    const promptRepo = new PromptsRepository()

    req.payload.promptRepo = promptRepo
    next()
}

const retrieveResults = async (req: Request, res:Response, next:NextFunction) => {
    const {userId, promptRepo}: {userId: string, promptRepo: PromptRepository} = req.payload

    const results = await promptRepo.getPromptsResult(userId)

    req.payload.results = results
    next()
}

const sendResult = async (req: Request, res:Response, next:NextFunction) => {
    const {results} = req.payload

    res.status(200).send({results})
}

export const retrievePromptsResult = (): RequestHandler[] => [
    initPayload,
    initRepository,
    retrieveResults,
    sendResult
  ];
  