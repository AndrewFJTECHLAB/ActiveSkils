export const parcoursProPrompt = (documentContent: string) => `Tableau simplifié et chronologique des expériences professionnelles
Nom de l'entreprise
Titre du poste
Date de début 
Date de fin
⚠️ Ne pas regrouper les expériences ; mentionner les évolutions internes distinctement.

Retourne UNIQUEMENT un JSON avec cette structure, classé par ordre chronologique (plus récent en premier) :
[
  {
    "entreprise": "",
    "titre_poste": "",
    "date_debut": "",
    "date_fin": ""
  }
]

Instructions :
- Si une information n'est pas trouvée, laisse le champ vide ""
- Pour les dates : utilise le format "MM/YYYY" ou "YYYY" selon les informations disponibles
- Pour la date de fin : si c'est le poste actuel, mettre "Présent" ou "En cours"
- Sépare distinctement chaque évolution de poste même dans la même entreprise
- Classe par ordre chronologique inversé (plus récent d'abord)
- Retourne UNIQUEMENT le JSON, aucun autre texte

Documents à analyser :
${documentContent}`;

const sysMessage =
  "Tu es un expert en analyse de CV et documents professionnels. Tu extrais uniquement les informations d'expérience professionnelle demandées au format JSON strict.";