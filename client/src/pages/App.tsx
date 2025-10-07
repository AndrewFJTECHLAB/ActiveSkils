import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const App = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

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

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : user.email;

  return (
    <div className="min-h-screen bg-background">
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
                  onClick={() => navigate("/documents")}
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
                  onClick={() => navigate("/portfolio")}
                >
                  Accéder au portfolio
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* DEBUG: Button to display resultat_prompt1 */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 text-center">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    🐛 Debug: Voir Resultat_prompt1
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Debug: Contenu de resultat_prompt1
                    </DialogTitle>
                    <DialogDescription>
                      Résultat de l'assistant OpenAI pour l'utilisateur{" "}
                      {displayName}
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
                        Aucun résultat d'assistant disponible pour cet
                        utilisateur.
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
