import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { debounce } from "lodash";
import { signUpWitheEmailAndPassword } from "@/../supabase/auth";
import { useNavigate } from "react-router-dom";

const validatePassword = (password: string) => {
  if (password.length < 6) {
    return { pass: false, msg: "Password must be at least 8 characters" };
  }

  return { pass: true };
};

const Signup = ({
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
  const [confirmPassword, setConfirmPassword] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  const debouncePasswordValidation = useCallback(
    debounce((value: string) => {
      const res = validatePassword(value);
      if (!res.pass) {
        toast({
          title: "Erreur",
          description: res.msg,
          variant: "destructive",
        });
      }

      setPassword(value);
    }, 600),
    []
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    //Check that password matched
    if (confirmPassword !== password) {
      return toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
    }

    setIsLoading(true);

    try {
      await signUpWitheEmailAndPassword({
        email,
        password,
      });

      toast({
        title: "Inscription réussie",
        description:
          "Veuillez vérifier votre email pour confirmer votre compte.",
      });

      setIsLoading(false);
      navigate("/");
    } catch (error) {
      setIsLoading(false);

      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="px-6 py-20 bg-gradient-to-br from-primary/5 to-primary-accent/5">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Inscription</CardTitle>
            <CardDescription>Inscrivez-vous à ActivSkills</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@exemple.com"
                  defaultValue={email}
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
                  defaultValue={password}
                  onChange={(e) => debouncePasswordValidation(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmation du Mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                onClick={() => setAction("LOGIN")}
                className="text-sm"
              >
                Déjà un compte ? Se connecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Signup;
