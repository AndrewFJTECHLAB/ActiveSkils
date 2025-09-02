import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
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
          <Button onClick={() => window.location.href = 'https://app.activskills.com/auth'}>Connexion</Button>
        </div>
      </header>

      {/* Section Hero */}
      <section className="px-6 py-20 bg-gradient-to-br from-primary/5 to-primary-accent/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 text-foreground">
            Vos compétences méritent une cartographie claire et puissante.
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Vous en avez fait des choses. Mais êtes-vous capable de les nommer clairement ? De les valoriser ? De les mobiliser au bon moment ? Pas si sûr…<br/><br/>

            ActivSkills vous aide à reconnecter les points entre ce que vous avez vécu, appris, mis en œuvre professionnellement.<br/><br/>

            Tout commence ici : en quelques clics. Vous nous confiez vos documents (CV, profil LinkedIn, diplômes, recommandations, etc.) et nous, on en extrait l'essentiel pour construire la première version de votre portefeuille de compétences dynamique.<br/><br/>

            Pas besoin de tout réécrire. Ce que vous avez déjà fait suffit pour révéler ce que vous valez. Téléchargez vos documents. On s'occupe du reste.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = 'https://app.activskills.com/auth'}
              className="bg-primary hover:bg-primary/90"
            >
              Commencer l'analyse
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.href = '/documents'}>
              Gérer mes documents
            </Button>
          </div>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Fonctionnalités clés</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-primary rounded" />
                </div>
                <CardTitle>Analyse intelligente de vos documents</CardTitle>
                <CardDescription>
                  Nous extrayons automatiquement toutes les données clés (expériences, formations, compétences, réalisations…) pour bâtir une première version de votre profil et de votre portefeuille de compétences.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-primary-accent rounded" />
                </div>
                <CardTitle>Construction dynamique de votre portfolio de compétences</CardTitle>
                <CardDescription>
                  Nos algorithmes croisent plusieurs référentiels (ROME, ESCO, DigComp, OCDE…) pour identifier et classer vos compétences dans 9 catégories de compétences : techniques & métier, sectorielles, relationnelles, en management & leadership, analytiques & stratégiques, digitales & data, ESG & Impact social, linguistiques.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <div className="w-6 h-6 bg-primary rounded" />
                </div>
                <CardTitle>Préqualification de vos points forts</CardTitle>
                <CardDescription>
                  Les compétences que vous maîtrisez le plus intègrent votre portefeuille de compétences. Les autres restent visibles dans votre plan de développement.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Section Pourquoi c'est utile */}
      <section className="px-6 py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">
            Pourquoi c'est utile pour vous ?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">✔️</div>
              <h4 className="text-xl font-bold mb-4">Clarté</h4>
              <p className="text-muted-foreground">
                Vos compétences deviennent lisibles, structurées et valorisables.<br/>
                Vous voyez enfin ce que vous savez faire, noir sur blanc.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">✔️</div>
              <h4 className="text-xl font-bold mb-4">Légitimité</h4>
              <p className="text-muted-foreground">
                Vous identifiez vos forces réelles.<br/>
                Votre parcours prend tout son sens.
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">✔️</div>
              <h4 className="text-xl font-bold mb-4">Confiance & action</h4>
              <p className="text-muted-foreground">
                Vous avancez avec des bases solides et des outils pour vos projets : évolution, repositionnement, création d'activité.<br/>
                Votre potentiel devient actionnable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Call-to-Action */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">
            Prêt(e) à découvrir toutes vos compétences ?
          </h3>
          <p className="text-lg text-muted-foreground mb-8">
            Il ne vous reste qu'une chose à faire pour démarrer : téléchargez vos documents, activez votre profil, explorez votre portfolio de compétences.<br/><br/>
            Confidentialité garantie • Des résultats immédiats
          </p>
          <Button 
            size="lg" 
            onClick={() => window.location.href = 'https://app.activskills.com/auth'}
            className="bg-primary hover:bg-primary/90"
          >
            Commencer maintenant
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 ActivSkills. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
