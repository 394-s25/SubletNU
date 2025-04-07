import React from "react";
import { auth } from "../firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";



export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Verify Northwestern email
      if (!user.email.endsWith("northwestern.edu")) {
        alert("Please use your Northwestern email.");
        await auth.signOut();
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error during sign in", error);
    }
  };

  return (
    <div className="container">

      <h2>Login with your Northwestern Email</h2>
      <button onClick={handleLogin}>Sign in with Google</button>
    </div>

  );
}
