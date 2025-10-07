import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Login from "./Auth/Login";
import Signup from "./Auth/Signup";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"LOGIN" | "SIGNUP">("LOGIN");

  return (
    <div className="min-h-screen bg-background">
      {action === "LOGIN" && (
        <Login
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setAction={setAction}
        />
      )}
      {action === "SIGNUP" && (
        <Signup
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setAction={setAction}
        />
      )}
    </div>
  );
};

export default Auth;
