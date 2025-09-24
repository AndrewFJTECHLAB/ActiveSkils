export const individualDataPrompt = (documentContent: string) =>  `Analyse les documents suivants et extrais UNIQUEMENT les informations personnelles suivantes au format JSON strict :

{
  "nom": "",
  "prenom": "",
  "email": "",
  "age": "",
  "linkedin_url": "",
  "lieu_residence": "",
  "annees_experience": ""
}

Instructions :
- Si une information n'est pas trouvée ou n'est pas déductible, laisse le champ vide ""
- Pour l'âge : si la date de naissance est présente, calcule l'âge, sinon cherche s'il est mentionné directement
- Pour les années d'expérience : compte le nombre total d'années d'expérience professionnelle
- Pour LinkedIn : cherche une URL LinkedIn complète
- Pour le lieu de résidence : cherche l'adresse actuelle ou la ville de résidence
- Retourne UNIQUEMENT le JSON, aucun autre texte

Documents à analyser :
${documentContent}`;

const sysMsg =
  "Tu es un assistant spécialisé dans l'extraction de données personnelles à partir de documents. Tu dois retourner uniquement du JSON valide.";