export enum DOCUMENT_STATUS {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  ERROR = "error",
}

export enum OCR_JOB_STATUS {
  QUEUED = "queued",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum OpenAiRole {
  SYSTEM = "system",
  USER = "user",
}

export enum Prompts {
  REALISATIONS = "extract-realisations",
  AUTRES_EXPERIENCE = "extract-autres-experiences",
  PARCOURS_PRO = "extract-parcours-professionnel",
  FORMATIONS = "extract-formations",
  INDIVIDUAL_DATA = "extract-individual-data",
  Realisation = "extract-realisations",
  OPENAI_ASSISTANT = "openai-assistant",
}