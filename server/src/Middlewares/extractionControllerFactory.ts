import { NextFunction, Request, RequestHandler, Response } from "express";

import { extractIndividualData } from "../controllers/extract-individual-data.controller";
import { extractFormations } from "../controllers/extract-formations.controller";
import { extractParcoursPro } from "../controllers/extract-parcoursPro.controller";
import { extractAutresExperience } from "../controllers/extract-autresExperience.controller";
import { extractRealisations } from "../controllers/extract-realisations.controller";
import { openAiAssistant } from "../controllers/openAi-assistant.controller";

export enum DOCUMENT_PROCESS {
    INDIVIDUAL_DATA = "extract-individual-data",
    FORMATION = "extract-formations",
    PARCOURS_PRO = "extract-parcours-professionnel",
    AUTRES_EXP = "extract-autres-experiences",
    REALISATION = "extract-realisations",
    LAUNCH_ANALYSIS = "openai-assistant",
}

export const composeHandlers = (handlers: RequestHandler[]): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        for (const handler of handlers) {

          await new Promise<void>((resolve, reject) => {
            handler(req, res, (err?: any) => (err ? reject(err) : resolve()));
          });
  
          if (res.headersSent) return;
        }
        next();
      } catch (err) {
        next(err);
      }
    };
  };

const CONTROLLER_MAPPING: Record<DOCUMENT_PROCESS, RequestHandler> ={
    [DOCUMENT_PROCESS.INDIVIDUAL_DATA]: composeHandlers(extractIndividualData()),
    [DOCUMENT_PROCESS.FORMATION]: composeHandlers(extractFormations()),
    [DOCUMENT_PROCESS.PARCOURS_PRO]: composeHandlers(extractParcoursPro()),
    [DOCUMENT_PROCESS.AUTRES_EXP]: composeHandlers(extractAutresExperience()),
    [DOCUMENT_PROCESS.REALISATION]: composeHandlers(extractRealisations()),
    [DOCUMENT_PROCESS.LAUNCH_ANALYSIS]: composeHandlers(openAiAssistant()),
  };

export const extractionControllerFactory = () => {
    return async (req: Request, res:Response, next:NextFunction) => {
        const { key } = req.body;
        const handler = CONTROLLER_MAPPING[key as DOCUMENT_PROCESS];

        if(!handler) {
            return res.status(400).json({ error: "Invalid document process key or Process not yet implemented" });
        }

        try {
            await handler(req, res, next)
          } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Internal server error" });
          }
    }
}