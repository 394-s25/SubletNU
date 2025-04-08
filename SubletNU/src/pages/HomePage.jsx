import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Listing from "../components/Listing";

export default function HomePage() {
  const [filter, setFilter] = useState("");
  

  return (
    <div>
      <h2>Sublet Listings</h2>
      <input 
        type="text" 
        placeholder="Filter by location" 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <Listing />
      <Link to="/create-listing">Create New Listing</Link>
      <br />
      <Link to="/profile">View Profile</Link>
    </div>
  );
}
