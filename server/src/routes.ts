import express from "express";
import { extractPdf } from "./controllers/extract-pdf.controller";
import { extractIndividualData } from "./controllers/extract-individual-data.controller";

const router = express.Router();

router.post("/extract/pdf-data", extractPdf());
router.post("/extract/individual-data", extractIndividualData());

export default router