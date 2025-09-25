import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  extractFormations,
  extractIndividualData,
  extractParcoursPro,
  openAiAssistant,
  extractAutresExperience as extractAddExp,
  extractRealisations as extractReal,
} from "@/api/POST/routes";
import { updateProfile } from "../../supabase/profiles";
import { useAuth } from "@/context/AuthContext";
import { Document } from "../../types/type";
import { DOCUMENT_PROCESS } from "../../types/enum";

const Portfolio = () => {
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [fetchingDocuments, setFetchingDocuments] = useState(false);
  const [executing, setExecuting] = useState(null);

  const { toast } = useToast();

  const fetchDocuments = async () => {
    setFetchingDocuments(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      });
    } finally {
      setFetchingDocuments(false);
    }
  };

  const extractIndividualDataFromDocs = async (key) => {
    if (documents.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun document complété disponible pour l'extraction",
        variant: "destructive",
      });
      return;
    }

    setExecuting(key);
    try {
      const documentIds = documents.map((doc) => doc.id);

      const data: any = await extractIndividualData(documentIds);

      if (data.success) {
        toast({
          title: "Succès",
          description: `Extraction terminée avec succès pour ${data.documentsCount} document(s)`,
        });

        // Store the extracted data in the profile
        if (user) {
          const updateData = { extracted_individual_data: data.extractedData };

          await updateProfile(updateData, user.id);

          await refreshProfile();
        }
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Error extracting individual data:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'extraction",
        variant: "destructive",
      });
    } finally {
      setExecuting(null);
    }
  };

  const extractFormationsData = async (key) => {
    if (documents.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun document complété disponible pour l'extraction",
        variant: "destructive",
      });
      return;
    }

    setExecuting(key);
    try {
      const documentIds = documents.map((doc) => doc.id);

      const data: any = await extractFormations(documentIds);

      if (data.success) {
        toast({
          title: "Succès",
          description: `Formations extraites avec succès pour ${data.documentsProcessed} document(s)`,
        });

        // Store the extracted formations data in the profile
        if (user) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              extracted_formations_data: data.extractedData,
            } as any)
            .eq("user_id", user.id);

          if (updateError) {
            console.error("Error updating profile:", updateError);
          } else {
            await refreshProfile();
          }
        }
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Error extracting formations data:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'extraction des formations",
        variant: "destructive",
      });
    } finally {
      setExecuting(null);
    }
  };

  const extractParcoursData = async (key) => {
    if (documents.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun document complété disponible pour l'extraction",
        variant: "destructive",
      });
      return;
    }

    setExecuting(key);
    try {
      const documentIds = documents.map((doc) => doc.id);

      const data: any = await extractParcoursPro(documentIds);

      if (data.success) {
        toast({
          title: "Succès",
          description: `Parcours professionnel extrait avec succès pour ${data.documentsCount} document(s)`,
        });

        // Store the extracted parcours data in the profile
        if (user) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ extracted_parcours_data: data.extractedData } as any)
            .eq("user_id", user.id);

          if (updateError) {
            console.error("Error updating profile:", updateError);
          } else {
            await refreshProfile();
          }
        }
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Error extracting parcours data:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error
            ? error.message
            : "Erreur lors de l'extraction du parcours professionnel",
        variant: "destructive",
      });
    } finally {
      setExecuting(null);
    }
  };

  const extractAutresExperiences = async (key) => {
    if (!user || documents.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun document à analyser",
        variant: "destructive",
      });
      return;
    }

    setExecuting(key);
    try {
      const data: any = await extractAddExp(user.id);

      if (data.success) {
        toast({
          title: "Succès",
          description: "Autres expériences extraites avec succès",
        });
        // Refresh profile data
        await refreshProfile();
      } else {
        throw new Error(data.error || "Erreur lors de l'extraction");
      }
    } catch (error: any) {
      console.error("Error extracting autres experiences:", error);
      toast({
        title: "Erreur",
        description:
          error.message || "Erreur lors de l'extraction des autres expériences",
        variant: "destructive",
      });
    } finally {
      setExecuting(null);
    }
  };

  const extractRealisations = async (key) => {
    if (!user || documents.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun document à analyser",
        variant: "destructive",
      });
      return;
    }

    setExecuting(key);
    try {
      const data: any = await extractReal(user.id);

      if (data.success) {
        toast({
          title: "Succès",
          description: "Réalisations extraites avec succès",
        });
        // Refresh profile data
        await refreshProfile();
      } else {
        throw new Error(data.error || "Erreur lors de l'extraction");
      }
    } catch (error: any) {
      console.error("Error extracting realisations:", error);
      toast({
        title: "Erreur",
        description:
          error.message || "Erreur lors de l'extraction des réalisations",
        variant: "destructive",
      });
    } finally {
      setExecuting(null);
    }
  };

  const launchAnalysis = async (key) => {
    if (documents.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun document complété disponible pour l'analyse",
        variant: "destructive",
      });
      return;
    }

    setExecuting(key);
    try {
      const documentIds = documents.map((doc) => doc.id);

      const data: any = await openAiAssistant(
        documentIds,
        user.id,
        "Analyse ces documents et fournis un résumé détaillé des compétences et expériences professionnelles."
      );

      if (data.success) {
        toast({
          title: "Succès",
          description: `Analyse terminée avec succès pour ${data.documentsCount} document(s)`,
        });

        // Refresh profile to get updated resultat_prompt1
        if (user) {
          await refreshProfile();
        }
      } else {
        throw new Error(data.error || "Erreur inconnue");
      }
    } catch (error) {
      console.error("Error analyzing documents:", error);
      toast({
        title: "Erreur",
        description:
          error instanceof Error ? error.message : "Erreur lors de l'analyse",
        variant: "destructive",
      });
    } finally {
      setExecuting(null);
    }
  };

  const DocumentProcesses = [
    {
      key: DOCUMENT_PROCESS.INDIVIDUAL_DATA,
      label: "Extraire les données individuelles",
      function: (key) => extractIndividualDataFromDocs(key),
    },
    {
      key: DOCUMENT_PROCESS.FORMATION,
      label: "Extraire les formations",
      function: (key) => extractFormationsData(key),
    },
    {
      key: DOCUMENT_PROCESS.PARCOURS_PRO,
      label: "Extraire le parcours professionnel",
      function: (key) => extractParcoursData(key),
    },
    {
      key: DOCUMENT_PROCESS.AUTRES_EXP,
      label: "Extraire les autres expériences",
      function: (key) => extractAutresExperiences(key),
    },
    {
      key: DOCUMENT_PROCESS.REALISATION,
      label: "Extraire les réalisations identifiables",
      function: (key) => extractRealisations(key),
    },
    {
      key: DOCUMENT_PROCESS.LAUNCH_ANALYSIS,
      label: "Lancer l'analyse",
      function: (key) => launchAnalysis(key),
      variant: "default" as const,
      loadingText: "Analyse en cours...",
    },
  ];

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  if (isLoading || fetchingDocuments) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              Portfolio de Compétences
            </h2>
            <p className="text-muted-foreground">
              Analysez vos documents pour générer votre portfolio de compétences
            </p>
          </div>

          {/* Analysis section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Analyse de vos documents</CardTitle>
              <CardDescription>
                {documents.length > 0
                  ? `${documents.length} document(s) disponible(s) pour l'analyse`
                  : "Aucun document complété disponible"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">{doc.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {doc.document_type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.file_name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {DocumentProcesses.map((docProcess) => (
                    <Button
                      key={docProcess.key}
                      onClick={() => docProcess.function(docProcess.key)}
                      disabled={executing || documents.length === 0}
                      variant={docProcess.variant ?? "secondary"}
                      className="w-full md:w-auto"
                    >
                      {executing == docProcess.key ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {docProcess.loadingText ?? "Extraction en cours..."}
                        </>
                      ) : (
                        docProcess.label
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Individual Data Extraction Results */}
            {profile?.extracted_individual_data && (
              <Card>
                <CardHeader>
                  <CardTitle>Données individuelles extraites</CardTitle>
                  <CardDescription>
                    Informations personnelles extraites des documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {profile.extracted_individual_data}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formations Data Extraction Results */}
            {profile?.extracted_formations_data && (
              <Card>
                <CardHeader>
                  <CardTitle>Formations et diplômes extraits</CardTitle>
                  <CardDescription>
                    Tableau des formations extraites des documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {profile.extracted_formations_data}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Parcours Professionnel Extraction Results */}
            {profile?.extracted_parcours_data && (
              <Card>
                <CardHeader>
                  <CardTitle>Parcours professionnel extrait</CardTitle>
                  <CardDescription>
                    Tableau chronologique des expériences professionnelles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {profile.extracted_parcours_data}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Autres Expériences Extraction Results */}
            {profile?.extracted_autres_experiences_data && (
              <Card>
                <CardHeader>
                  <CardTitle>Autres expériences extraites</CardTitle>
                  <CardDescription>
                    Activités bénévoles, associatives, sportives et de vie
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {profile.extracted_autres_experiences_data}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Réalisations Extraction Results */}
            {profile?.extracted_realisations_data && (
              <Card>
                <CardHeader>
                  <CardTitle>Réalisations identifiables extraites</CardTitle>
                  <CardDescription>
                    Toutes les réalisations distinctes avec contexte et méthodes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {profile.extracted_realisations_data}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full Analysis Results */}
            {profile?.resultat_prompt1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Résultats de l'analyse complète</CardTitle>
                  <CardDescription>
                    Résultat brut de l'assistant OpenAI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">
                      {profile.resultat_prompt1}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {!profile?.extracted_individual_data &&
            !profile?.extracted_formations_data &&
            !profile?.extracted_parcours_data &&
            !profile?.extracted_autres_experiences_data &&
            !profile?.extracted_realisations_data &&
            !profile?.resultat_prompt1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Aucune analyse disponible</CardTitle>
                  <CardDescription>
                    Lancez une extraction ou une analyse pour voir vos résultats
                    ici
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
        </div>
      </main>
    </div>
  );
};

export default Portfolio;
