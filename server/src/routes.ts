import express from "express";
import { extractPdf } from "./controllers/extract-pdf.controller";


const router = express.Router()

router.post("/extract-pdf-data", extractPdf());

export default router