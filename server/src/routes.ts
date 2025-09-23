import express from "express";
import { extractPdf } from "./controllers/extract-pdf.controller";
import { extractIndividualData } from "./controllers/extract-individual-data.controller";
import { extractFormations } from "./controllers/extract-formations.controller";
import { extractParcoursPro } from "./controllers/extract-parcoursPro.controller";
import { extractRealisations } from "./controllers/extract-realisations.controller";
import { extractAutresExperience } from "./controllers/extract-autresExperience.controller";
import { openAiAssistant } from "./controllers/openAi-assistant.controller";

const router = express.Router();

router.post("/extract/pdf-data", extractPdf());
router.post("/extract/individual-data", extractIndividualData());
router.post("/extract/formations", extractFormations());
router.post("/extract/parcours-pro", extractParcoursPro());
router.post("/extract/realisation", extractRealisations());
router.post("/extract/autres-experience", extractAutresExperience());
router.post("/analysis/openAi", openAiAssistant());

export default router;
