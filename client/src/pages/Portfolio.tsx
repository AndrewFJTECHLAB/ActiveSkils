import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { launchExtraction } from "@/api/POST/routes";
import { useAuth } from "@/context/AuthContext";
import { Document } from "../../types/type";
import { DOCUMENT_PROCESS } from "../../types/enum";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { fetchPromptsResult } from "@/api/GET/routes";
import { fetchPrompts } from "@/../supabase/prompts";

const Portfolio = () => {
  const { user, profile, isLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [fetchingDocuments, setFetchingDocuments] = useState(false);
  const [actions, setActions] = useState([]);
  const [promptResults, setPromptResults] = useState([]);
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

  const retrievePromptResults = async () => {
    const data: any = await fetchPromptsResult(user.id);

    const formattedResult = data.results.map(({ prompt_id, result }) => ({
      prompt_id,
      result: JSON.parse(result),
    }));

    setPromptResults(formattedResult);
  };

  const DocumentProcesses = useCallback(async () => {
    try {
      const data = await fetchPrompts();
      setActions(data);
    } catch (error) {
      console.log("Error while fetching prompts: ", error.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger les actions",
        variant: "destructive",
      });
    }
  }, []);

  const handleExtraction = async (key: DOCUMENT_PROCESS) => {
    setExecuting(key);

    const documentIds = documents.map((doc) => doc.id);
    try {
      const data: any = await launchExtraction(user.id, documentIds, key);

      if (data.success) {
        toast({
          title: "Succès",
          description: "Extraction reussis avec succès",
        });

        await retrievePromptResults();
      } else {
        throw new Error(data.error || "Erreur lors de l'extraction");
      }
    } catch (error: any) {
      console.error("Error extracting: ", error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'extraction",
        variant: "destructive",
      });
    } finally {
      setExecuting(null);
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchDocuments(),
        DocumentProcesses(),
        retrievePromptResults(),
      ]);
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

  console.log(promptResults);

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
                  {actions.map((docProcess) => (
                    <Button
                      key={docProcess.key}
                      onClick={() => handleExtraction(docProcess.key)}
                      disabled={executing || documents.length === 0}
                      variant={
                        docProcess.key === DOCUMENT_PROCESS.LAUNCH_ANALYSIS
                          ? "default"
                          : "secondary"
                      }
                      className="w-full md:w-auto"
                    >
                      {executing == docProcess.key ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {docProcess.loadingText ?? "Extraction en cours..."}
                        </>
                      ) : (
                        docProcess.button_label
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(
                          JSON.parse(profile.extracted_individual_data)
                        ).map((val, idx) => (
                          <TableHead key={idx}>{val}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        {Object.values(
                          JSON.parse(profile.extracted_individual_data)
                        ).map((val: any, idx) => (
                          <TableCell key={idx}>{val}</TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
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
