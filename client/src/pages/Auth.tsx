import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  // const [firstName, setFirstName] = useState("");
  // const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message === "Invalid login credentials" 
            ? "Email ou mot de passe incorrect." 
            : error.message,
          variant: "destructive",
        });
      } else if (data.user) {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté.",
        });
        // Redirect to app subdomain
        window.location.href = import.meta.env.VITE_REDIRECT_URL;
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // const handleSignUp = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   
  //   if (!email || !password || !confirmPassword || !firstName || !lastName) {
  //     toast({
  //       title: "Erreur",
  //       description: "Veuillez remplir tous les champs.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   if (password !== confirmPassword) {
  //     toast({
  //       title: "Erreur",
  //       description: "Les mots de passe ne correspondent pas.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   if (password.length < 6) {
  //     toast({
  //       title: "Erreur",
  //       description: "Le mot de passe doit contenir au moins 6 caractères.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //     const { error } = await supabase.auth.signUp({
  //       email,
  //       password,
  //       options: {
  //         emailRedirectTo: `https://app.activskills.com/app`,
  //         data: {
  //           first_name: firstName,
  //           last_name: lastName,
  //         }
  //       }
  //     });

  //     if (error) {
  //       toast({
  //         title: "Erreur d'inscription",
  //         description: error.message,
  //         variant: "destructive",
  //       });
  //     } else {
  //       toast({
  //         title: "Inscription réussie",
  //         description: "Veuillez vérifier votre email pour confirmer votre compte.",
  //       });
  //       setIsSignUp(false); // Switch back to login form
  //     }
  //   } catch (error) {
  //     toast({
  //       title: "Erreur",
  //       description: "Une erreur inattendue s'est produite.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec logo et navigation */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/7fc3df79-912a-48f7-af7c-c4852fe05723.png" 
              alt="ActivSkills Logo" 
              className="h-8 w-8"
            />
            <h1 className="text-2xl font-bold text-primary">ActivSkills</h1>
          </div>
          <Button variant="outline" onClick={() => window.location.href = "https://activskills.com/"}>
            Retour à l'accueil
          </Button>
        </div>
      </header>

      {/* Section de connexion */}
      <section className="px-6 py-20 bg-gradient-to-br from-primary/5 to-primary-accent/5">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                Connexion
              </CardTitle>
              <CardDescription>
                Connectez-vous à votre compte ActivSkills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
              {/* 
              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm"
                >
                  {isSignUp 
                    ? "Déjà un compte ? Se connecter" 
                    : "Pas de compte ? S'inscrire"
                  }
                </Button>
              </div>
              */}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Auth;