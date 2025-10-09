import { useEffect, useState } from "react";
import { fetchPromptsResult } from "@/api/GET/routes";
import { useAuth } from "@/context/AuthContext";
import { DOCUMENT_PROCESS } from "@/../types/enum";
import IndividualData from "@/components/extracted-data/IndividualData";
import Formation from "@/components/extracted-data/Formation";
import AutresExp from "@/components/extracted-data/AutresExp";
import ParcoursPro from "@/components/extracted-data/ParcoursPro";
import Realisations from "@/components/extracted-data/Realisations";
import Analysis from "@/components/extracted-data/Analysis";

const RESULT_COMPONENT_MAPPING = {
  [DOCUMENT_PROCESS.INDIVIDUAL_DATA]: IndividualData,
  [DOCUMENT_PROCESS.FORMATION]: Formation,
  [DOCUMENT_PROCESS.AUTRES_EXP]: AutresExp,
  [DOCUMENT_PROCESS.PARCOURS_PRO]: ParcoursPro,
  [DOCUMENT_PROCESS.REALISATION]: Realisations,
  [DOCUMENT_PROCESS.LAUNCH_ANALYSIS]: Analysis,
};

const Profile = () => {
  const { user, isLoading } = useAuth();

  const [promptResults, setPromptResults] = useState([]);

  const retrievePromptResults = async () => {
    const data: any = await fetchPromptsResult(user.id);

    const formattedResult = data.results.map(({ prompts, result }) => ({
      ...prompts,
      result: JSON.parse(result),
    }));

    setPromptResults(formattedResult);
  };

  useEffect(() => {
    if (user) {
      retrievePromptResults();
    }
  }, [user]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-6 xl:grid-cols-2">
          {promptResults.map(({ key, ...rest }) => {
            const Component = RESULT_COMPONENT_MAPPING[key];

            return Component ? <Component key={key} {...rest} /> : null;
          })}
        </div>
      </main>
    </div>
  );
};

export default Profile;
