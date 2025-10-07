import express from "express";
import { extractPdf } from "./controllers/extract-pdf.controller";
import { retrievePromptsResult } from "./controllers/retrievePromptsResult.controller";
import { extractionControllerFactory } from "./Middlewares/extractionControllerFactory";

const router = express.Router();

// ---- GET
router.get("/prompt-results/:userId", retrievePromptsResult());

// ---- POST
router.post("/extract/pdf-data", extractPdf());
router.post("/launch-extraction", extractionControllerFactory());

export default router;
