import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

interface Document {
  id: string;
  title: string;
  file_name: string;
  document_type: string;
  status: string;
  created_at: string;
  markdown_content?: string;
  markdown_file_path?: string;
}

interface Profile {
  first_name?: string;
  last_name?: string;
  resultat_prompt1?: string;
  extracted_individual_data?: string;
  extracted_formations_data?: string;
  extracted_parcours_data?: string;
  extracted_autres_experiences_data?: string;
  extracted_realisations_data?: string;
}

const Portfolio = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingData, setIsExtractingData] = useState(false);
  const [isExtractingFormations, setIsExtractingFormations] = useState(false);
  const [isExtractingParcours, setIsExtractingParcours] = useState(false);
  const [isExtractingAutresExperiences, setIsExtractingAutresExperiences] = useState(false);
  const [isExtractingRealisations, setIsExtractingRealisations] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
          await fetchDocuments(session.user.id);
        } else {
          setProfile(null);
          window.location.href = "https://app.activskills.com/auth";
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        window.location.href = "https://app.activskills.com/auth";
      } else {
        fetchProfile(session.user.id);
        fetchDocuments(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, resultat_prompt1, extracted_individual_data, extracted_formations_data, extracted_parcours_data, extracted_autres_experiences_data, extracted_realisations_data')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(profileData as Profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchDocuments = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les documents',
        variant: 'destructive'
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de se déconnecter.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Déconnexion réussie",
          description: "Vous avez été déconnecté.",
        });
        window.location.href = "https://activskills.com/";
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    }
  };

  const launchAnalysis = async () => {
    if (documents.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucun document complété disponible pour l\'analyse',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const documentIds = documents.map(doc => doc.id);
      
      const { data, error } = await supabase.functions.invoke('openai-assistant', {
        body: { 
          documentIds: documentIds,
          prompt: 'Analyse ces documents et fournis un résumé détaillé des compétences et expériences professionnelles.'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Succès',
          description: `Analyse terminée avec succès pour ${data.documentsCount} document(s)`,
        });
        
        // Refresh profile to get updated resultat_prompt1
        if (user) {
          await fetchProfile(user.id);
        }
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }

    } catch (error) {
      console.error('Error analyzing documents:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'analyse',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractIndividualData = async () => {
    if (documents.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucun document complété disponible pour l\'extraction',
        variant: 'destructive'
      });
      return;
    }

    setIsExtractingData(true);
    try {
      const documentIds = documents.map(doc => doc.id);
      
      const { data, error } = await supabase.functions.invoke('extract-individual-data', {
        body: { documentIds: documentIds }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Succès',
          description: `Extraction terminée avec succès pour ${data.documentsCount} document(s)`,
        });
        
        // Store the extracted data in the profile
        if (user) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ extracted_individual_data: data.extractedData } as any)
            .eq('user_id', user.id);
          
          if (updateError) {
            console.error('Error updating profile:', updateError);
          } else {
            await fetchProfile(user.id);
          }
        }
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }

    } catch (error) {
      console.error('Error extracting individual data:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'extraction',
        variant: 'destructive'
      });
    } finally {
      setIsExtractingData(false);
    }
  };

  const extractFormationsData = async () => {
    if (documents.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucun document complété disponible pour l\'extraction',
        variant: 'destructive'
      });
      return;
    }

    setIsExtractingFormations(true);
    try {
      const documentIds = documents.map(doc => doc.id);
      
      const { data, error } = await supabase.functions.invoke('extract-formations', {
        body: { documentIds: documentIds }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Succès',
          description: `Formations extraites avec succès pour ${data.documentsProcessed} document(s)`,
        });
        
        // Store the extracted formations data in the profile
        if (user) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ extracted_formations_data: data.extractedFormations } as any)
            .eq('user_id', user.id);
          
          if (updateError) {
            console.error('Error updating profile:', updateError);
          } else {
            await fetchProfile(user.id);
          }
        }
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }

    } catch (error) {
      console.error('Error extracting formations data:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'extraction des formations',
        variant: 'destructive'
      });
    } finally {
      setIsExtractingFormations(false);
    }
  };

  const extractParcoursData = async () => {
    if (documents.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Aucun document complété disponible pour l\'extraction',
        variant: 'destructive'
      });
      return;
    }

    setIsExtractingParcours(true);
    try {
      const documentIds = documents.map(doc => doc.id);
      
      const { data, error } = await supabase.functions.invoke('extract-parcours-professionnel', {
        body: { documentIds: documentIds }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Succès',
          description: `Parcours professionnel extrait avec succès pour ${data.documentsProcessed} document(s)`,
        });
        
        // Store the extracted parcours data in the profile
        if (user) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ extracted_parcours_data: data.extractedParcours } as any)
            .eq('user_id', user.id);
          
          if (updateError) {
            console.error('Error updating profile:', updateError);
          } else {
            await fetchProfile(user.id);
          }
        }
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }

    } catch (error) {
      console.error('Error extracting parcours data:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'extraction du parcours professionnel',
        variant: 'destructive'
      });
    } finally {
      setIsExtractingParcours(false);
    }
  };

  const extractAutresExperiences = async () => {
    if (!user || documents.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun document à analyser",
        variant: "destructive",
      });
      return;
    }

    setIsExtractingAutresExperiences(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-autres-experiences', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Succès",
          description: "Autres expériences extraites avec succès",
        });
        // Refresh profile data
        await fetchProfile(user.id);
      } else {
        throw new Error(data.error || 'Erreur lors de l\'extraction');
      }
    } catch (error: any) {
      console.error('Error extracting autres experiences:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'extraction des autres expériences",
        variant: "destructive",
      });
    } finally {
      setIsExtractingAutresExperiences(false);
    }
  };

  const extractRealisations = async () => {
    if (!user || documents.length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun document à analyser",
        variant: "destructive",
      });
      return;
    }

    setIsExtractingRealisations(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-realisations', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Succès",
          description: "Réalisations extraites avec succès",
        });
        // Refresh profile data
        await fetchProfile(user.id);
      } else {
        throw new Error(data.error || 'Erreur lors de l\'extraction');
      }
    } catch (error: any) {
      console.error('Error extracting realisations:', error);
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'extraction des réalisations",
        variant: "destructive",
      });
    } finally {
      setIsExtractingRealisations(false);
    }
  };

  if (isLoading) {
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

  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : user.email;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/7fc3df79-912a-48f7-af7c-c4852fe05723.png" 
                alt="ActivSkills Logo" 
                className="h-8 w-8"
              />
              <h1 className="text-2xl font-bold text-primary">ActivSkills</h1>
            </div>
            <nav className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/app')}
              >
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/documents')}
              >
                Documents
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/app')}
              >
                Profil
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/portfolio')}
                className="bg-accent text-accent-foreground"
              >
                Portfolio
              </Button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-foreground">{displayName}</span>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Portfolio de Compétences</h2>
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
                  : 'Aucun document complété disponible'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-3 border rounded-lg">
                        <h4 className="font-medium text-sm">{doc.title}</h4>
                        <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                        <p className="text-xs text-muted-foreground">{doc.file_name}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <Button 
                    onClick={extractIndividualData}
                    disabled={isExtractingData || documents.length === 0}
                    variant="secondary"
                    className="w-full md:w-auto"
                  >
                    {isExtractingData ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extraction en cours...
                      </>
                    ) : (
                      'Extraire les données individuelles'
                    )}
                  </Button>
                  
                  <Button 
                    onClick={extractFormationsData}
                    disabled={isExtractingFormations || documents.length === 0}
                    variant="secondary"
                    className="w-full md:w-auto"
                  >
                    {isExtractingFormations ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extraction en cours...
                      </>
                    ) : (
                      'Extraire les formations'
                    )}
                  </Button>
                  
                   <Button 
                    onClick={extractParcoursData}
                    disabled={isExtractingParcours || documents.length === 0}
                    variant="secondary"
                    className="w-full md:w-auto"
                  >
                    {isExtractingParcours ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extraction en cours...
                      </>
                    ) : (
                      'Extraire le parcours professionnel'
                    )}
                  </Button>
                  
                  <Button 
                    onClick={extractAutresExperiences}
                    disabled={isExtractingAutresExperiences || documents.length === 0}
                    variant="secondary"
                    className="w-full md:w-auto"
                  >
                    {isExtractingAutresExperiences ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extraction en cours...
                      </>
                    ) : (
                      'Extraire les autres expériences'
                    )}
                  </Button>
                  
                  <Button 
                    onClick={extractRealisations}
                    disabled={isExtractingRealisations || documents.length === 0}
                    variant="secondary"
                    className="w-full md:w-auto"
                  >
                    {isExtractingRealisations ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extraction en cours...
                      </>
                    ) : (
                      'Extraire les réalisations identifiables'
                    )}
                  </Button>
                  
                  <Button 
                    onClick={launchAnalysis}
                    disabled={isAnalyzing || documents.length === 0}
                    className="w-full md:w-auto"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyse en cours...
                      </>
                    ) : (
                      'Lancer l\'analyse'
                    )}
                  </Button>
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

          {!profile?.extracted_individual_data && !profile?.extracted_formations_data && !profile?.extracted_parcours_data && !profile?.extracted_autres_experiences_data && !profile?.extracted_realisations_data && !profile?.resultat_prompt1 && (
            <Card>
              <CardHeader>
                <CardTitle>Aucune analyse disponible</CardTitle>
                <CardDescription>
                  Lancez une extraction ou une analyse pour voir vos résultats ici
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