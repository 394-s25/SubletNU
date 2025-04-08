import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Listing from "../components/Listing";

export default function ProfilePage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div>
      <h2>Your Profile</h2>
      <p>Email: {auth.currentUser.email}</p>
      <button onClick={handleLogout}>Log Out</button>

      <div>
        <h2>Your Listings</h2>
        <Listing />
      </div>
    </div>
  );
}
