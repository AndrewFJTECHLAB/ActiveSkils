export const formationsPrompt = (
  documentContent: string
) => `Analyse des formations, diplômes et certificats
Tableau simplifié avec 4 colonnes
Nom de la formation
Année
Établissement
Catégorie : Diplômante, Certifiante, Autres formations
⚠️ Inclure les certificats même non diplômants

Retourne UNIQUEMENT un JSON avec cette structure :
[
  {
    "nom_formation": "",
    "annee": "",
    "etablissement": "",
    "categorie": ""
  }
]

Instructions :
- Si une information n'est pas trouvée, laisse le champ vide ""
- Pour l'année : utilise l'année d'obtention ou de fin de formation
- Catégorie doit être : "Diplômante", "Certifiante", ou "Autres formations"
- Retourne UNIQUEMENT le JSON, aucun autre texte

Documents à analyser :
${documentContent}`;

const sysMsg =
  "Tu es un expert en analyse de CV et documents professionnels. Tu extrais uniquement les informations de formation demandées au format JSON strict.";
