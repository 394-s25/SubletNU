import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Listing from "../components/Listing";
import "../css/profile.css"; 

export default function ProfilePage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="profile-container">
      <div className="profile-box">
        <h2 className="profile-title">Your Profile</h2>
        <p className="profile-email">Email: {auth.currentUser.email}</p>
        <button className="logout-button" onClick={handleLogout}>
          Log Out
        </button>
        <div>
            <h2>Your Listings</h2>
            <Listing />  
        </div>
      </div>
    </div>
  );
}
