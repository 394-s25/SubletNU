import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../css/Sidebar.css";

export default function Sidebar({ onShowAll, onShowUser, onCreateNew }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const isHome = location.pathname === "/";

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Logo" />
      </div>

      {/* 按钮们 */}
      <button
        onClick={() => navigate("/")}
        className={location.pathname === "/" ? "active" : ""}
      >
        🏠 Home
      </button>

      <button
        onClick={() => navigate("/profile")}
        className={location.pathname === "/profile" ? "active" : ""}
      >
        Profile
      </button>

      <button onClick={onCreateNew}>
        Create New Listing
      </button>
      

      {isHome && (
        <>
          <button onClick={onShowAll}>Show All Listings</button>
          <button onClick={onShowUser}>Show Your Listings</button>
        </>
      )}

      <button onClick={handleLogout}>
        Log Out
      </button>
    </div>
  );
}
