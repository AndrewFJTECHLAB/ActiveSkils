import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signInWithPassword } from "../../../supabase/auth";
import { Button } from "@/components/ui/button";

const loginErrors = (error: string) => {
  switch (error) {
    case "Invalid login credentials":
      return "Email ou mot de passe incorrect.";
    case "Email not confirmed":
      return "Veuillez confirmer votre email avant de continuer";
    default:
      return "Une erreur inattendue s'est produite.";
  }
};

const Login = ({
  isLoading,
  setIsLoading,
  setAction,
}: {
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  setAction: (action: "LOGIN" | "SIGNUP") => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
      await signInWithPassword({ email, password });

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
      });

      window.location.href = import.meta.env.VITE_REDIRECT_URL;
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: loginErrors(error.message),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="px-6 py-20 bg-gradient-to-br from-primary/5 to-primary-accent/5">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connexion</CardTitle>
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

            <div className="mt-4 text-center">
              <Button
                variant="link"
                onClick={() => setAction("SIGNUP")}
                className="text-sm"
              >
                Pas de compte ? S'inscrire
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Login;
