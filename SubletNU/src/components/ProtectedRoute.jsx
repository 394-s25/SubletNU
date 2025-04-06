import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  
  // If not logged in, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // Check that the email is a Northwestern email
  if (!currentUser.email.endsWith("northwestern.edu")) {
    alert("Please use your Northwestern email.");
    return <Navigate to="/login" />;
  }
  
  return children;
}
