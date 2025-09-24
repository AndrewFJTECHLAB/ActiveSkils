import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, user } = useAuth();

  const displayName = React.useMemo(() => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (profile?.last_name) {
      return profile.last_name;
    }
    return user?.email || "Utilisateur";
  }, [profile?.first_name, profile?.last_name, user?.email]);

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

  const navLinks = React.useMemo(() => {
    const currentPath = window.location.pathname;

    return [
      {
        displayName: "Dashboard",
        link: "/app",
        isActive: currentPath === "/app" ,
      },
      {
        displayName: "Documents",
        link: "/documents",
        isActive: currentPath.startsWith("/documents"),
      },
      {
        displayName: "Profile",
        link: "/profile",
        isActive: currentPath.startsWith("/profile"),
      },
      {
        displayName: "Portfolio",
        link: "/portfolio",
        isActive: currentPath.startsWith("/portfolio"),
      },
    ];
  }, [window.location.pathname]);

  return (
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
            {navLinks.map((navLink) => (
              <Button
                key={navLink.displayName}
                variant="ghost"
                size="sm"
                onClick={() => navigate(navLink.link)}
                className={`${navLink.isActive ? "bg-accent text-accent-foreground" : ""}`}
              >
                {navLink.displayName}
              </Button>
            ))}
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
  );
};

export default Navbar;
