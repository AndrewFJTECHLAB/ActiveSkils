export interface DOCUMENT_UPLOAD_STATUS {
  PENDING: "pending";
}

export enum DOCUMENT_PROCESS {
  INDIVIDUAL_DATA = "extract-individual-data",
  FORMATION = "extract-formations",
  PARCOURS_PRO = "extract-parcours-professionnel",
  AUTRES_EXP = "extract-autres-experiences",
  REALISATION = "extract-realisations",
  LAUNCH_ANALYSIS = "openai-assistant",
}