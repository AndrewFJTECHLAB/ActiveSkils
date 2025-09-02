-- Create prompts table for centralized prompt management
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  prompt_text TEXT NOT NULL,
  system_message TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- Create policies (read-only for authenticated users since these are system prompts)
CREATE POLICY "Prompts are readable by everyone" 
ON public.prompts 
FOR SELECT 
USING (true);

-- Only allow updates/inserts for service role (admin operations)
CREATE POLICY "Only service role can modify prompts" 
ON public.prompts 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_prompts_updated_at
BEFORE UPDATE ON public.prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing prompts from the edge functions
INSERT INTO public.prompts (name, prompt_text, system_message) VALUES 
(
  'extract-autres-experiences',
  'Liste simple des activités bénévoles, associatives, sportives ou de vie (mentorat, ateliers animés, animation de communauté, …) dans lesquelles des compétences ont été également acquises.
Nom de l''expérience
Description
Durée

Retourne les données sous forme de JSON avec cette structure exacte :
{
  "autres_experiences": [
    {
      "nom": "string",
      "description": "string", 
      "duree": "string"
    }
  ]
}

Si aucune expérience de ce type n''est trouvée, retourne: {"autres_experiences": []}

Documents à analyser:
{documents}',
  'Tu es un expert en extraction de données structurées. Tu dois extraire uniquement les activités bénévoles, associatives, sportives ou de vie personnelle qui démontrent des compétences acquises. Retourne uniquement du JSON valide.'
),
(
  'extract-formations',
  'Analyse des formations, diplômes et certificats
Tableau simplifié avec 4 colonnes
Nom de la formation
Année
Établissement
Catégorie : Diplômante, Certifiante, Autres formations
⚠️ Inclure les certificats même non diplômants

Documents à analyser:
{documents}',
  'Tu es un assistant expert en analyse de CV et documents professionnels. Tu extrais les formations de manière structurée et précise.'
),
(
  'extract-individual-data',
  'Analyse les documents suivants et extrais UNIQUEMENT les informations personnelles suivantes au format JSON strict :

{
  "nom": "",
  "prenom": "",
  "email": "",
  "age": "",
  "telephone": "",
  "adresse": "",
  "ville": "",
  "code_postal": "",
  "pays": "",
  "nationalite": "",
  "date_naissance": "",
  "lieu_naissance": "",
  "situation_familiale": "",
  "permis_conduire": "",
  "linkedin": "",
  "github": "",
  "site_web": ""
}

Documents à analyser:
{documents}',
  'Tu es un assistant spécialisé dans l''extraction de données personnelles à partir de documents. Tu dois retourner uniquement du JSON valide.'
),
(
  'extract-parcours-professionnel',
  'Tableau simplifié et chronologique des expériences professionnelles
Nom de l''entreprise
Titre du poste
Date de début 
Date de fin
⚠️ Ne pas regrouper les expériences ; mentionner les évolutions internes distinctement.

Documents à analyser:
{documents}',
  'Tu es un assistant expert en analyse de CV et documents professionnels. Tu extrais les expériences professionnelles de manière structurée et précise.'
),
(
  'extract-realisations',
  'Extraire toutes les réalisations identifiables, sans limitation de nombre.
Pour chacune :
Réalisation (formulation courte et concrète)
Contexte (nom de l''entreprise, mission, projet)
Méthode ou approche utilisée
Résultat observable
⚠️ Inclure toutes les réalisations distinctes, même issues de projets transverses.

Retourne les données sous forme de JSON avec cette structure exacte :
{
  "realisations": [
    {
      "realisation": "string",
      "contexte": "string",
      "methode": "string", 
      "resultat": "string"
    }
  ]
}

Si aucune réalisation n''est trouvée, retourne: {"realisations": []}

Documents à analyser:
{documents}',
  'Tu es un assistant expert en analyse de CV et documents professionnels. Tu extrais les réalisations de manière structurée et précise. Retourne uniquement du JSON valide.'
);