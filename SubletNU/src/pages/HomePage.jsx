import React, { useState, useEffect } from "react";
import { firestore, auth } from "../firebase";
import { collection, query, onSnapshot, addDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import "../css/home.css"; // 

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const q = query(collection(firestore, "listings"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listingsData = [];
      querySnapshot.forEach((doc) => {
        listingsData.push({ id: doc.id, ...doc.data() });
      });
      setListings(listingsData);
    });
    return unsubscribe;
  }, []);

  const filteredListings = listings.filter((listing) =>
    listing.location.toLowerCase().includes(filter.toLowerCase())
  );

  const handleRequestMatch = async (listingId) => {
    try {
      await addDoc(collection(firestore, "matchRequests"), {
        listingId,
        requester: auth.currentUser.uid,
        requestedAt: new Date(),
      });
      alert("Match request sent!");
    } catch (error) {
      console.error("Error sending match request", error);
    }
  };


  return (
    <div className="home-container">
      <div className="home-box">

        <div className="home-left">
          <h2 className="home-title">Sublet Listings</h2>

          <input
            type="text"
            placeholder="Filter by location"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="home-input"
          />

          <div className="home-links">
            <Link to="/create-listing">Create New Listing</Link>
            <br />
            <Link to="/profile">View Profile</Link>
          </div>
        </div>


        <div className="home-right">
          <img
            src="/2.png"
            alt="map"
            className="home-image"
          />
        </div>
      </div>
    </div>
  );


}
