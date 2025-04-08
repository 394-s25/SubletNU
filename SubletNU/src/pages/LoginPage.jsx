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
    <div className="outer-container">
      <div className="login-box">

        <div className="login-left">
          <h2 className="login-title">Login with your Northwestern Email</h2>
          <button className="login-button" onClick={handleLogin}>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google logo"
              className="google-icon"
            />
            Sign in with Google
          </button>
        </div>


        <div className="login-right">
          <img
            src="/1.jpg"
            alt="Visual"
            className="login-image"
          />
        </div>
      </div>
    </div>
  );
}
