import React from "react";
import Sidebar from "./Sidebar";
import "../css/page-wrapper.css";

export default function PageWrapper({ children, onShowAll, onShowUser, onCreateNew }) {
  return (
    <div className="page-container">
      <Sidebar
        onShowAll={onShowAll}
        onShowUser={onShowUser}
        onCreateNew={onCreateNew}
      />
      <div className="page-box">
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}
