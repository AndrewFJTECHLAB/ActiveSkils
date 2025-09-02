import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ first_name?: string; last_name?: string; resultat_prompt1?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('first_name, last_name, resultat_prompt1')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (error) {
                console.error('Error fetching profile:', error);
              } else {
                setProfile(profileData);
              }
            } catch (error) {
              console.error('Error fetching profile:', error);
            }
          }, 0);
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
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
        // Redirect to main domain
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
    return null; // Will redirect to auth
  }

  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : user.email;

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec logo et navigation */}
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
                className="bg-accent text-accent-foreground"
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

      {/* Section principale */}
      <section className="px-6 py-20 bg-gradient-to-br from-primary/5 to-primary-accent/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground">
              Bienvenue {profile?.first_name || user.email}
            </h2>
            <p className="text-xl text-muted-foreground">
              Votre plateforme d'analyse de compétences
            </p>
          </div>

          {/* Tableau de bord */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-primary rounded" />
                </div>
                <CardTitle>Mes documents</CardTitle>
                <CardDescription>
                  Gérez et analysez vos documents de compétences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => navigate('/documents')}
                >
                  Gérer
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-primary-accent rounded" />
                </div>
                <CardTitle>Mes profils</CardTitle>
                <CardDescription>
                  Consultez vos profils de compétences normalisés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Voir mes profils
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-primary rounded" />
                </div>
                <CardTitle>Portfolio</CardTitle>
                <CardDescription>
                  Gérez votre portfolio de compétences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => navigate('/portfolio')}
                >
                  Accéder au portfolio
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* DEBUG: Button to display resultat_prompt1 */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 text-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    🐛 Debug: Voir Resultat_prompt1
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Debug: Contenu de resultat_prompt1</DialogTitle>
                    <DialogDescription>
                      Résultat de l'assistant OpenAI pour l'utilisateur {displayName}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4">
                    {profile?.resultat_prompt1 ? (
                      <div className="p-4 bg-muted rounded-lg">
                        <pre className="whitespace-pre-wrap text-sm">
                          {profile.resultat_prompt1}
                        </pre>
                      </div>
                    ) : (
                      <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                        Aucun résultat d'assistant disponible pour cet utilisateur.
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default App;