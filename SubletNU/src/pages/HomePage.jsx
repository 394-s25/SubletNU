import React, { useState, useEffect } from "react";
import { firestore, auth } from "../firebase";
import { collection, query, onSnapshot, addDoc } from "firebase/firestore";
import { Link } from "react-router-dom";

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

  const filteredListings = listings.filter(listing =>
    listing.location.toLowerCase().includes(filter.toLowerCase())
  );

  // Handle match request
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
    <div>
      <h2>Sublet Listings</h2>
      <input 
        type="text" 
        placeholder="Filter by location" 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <ul>
        {filteredListings.map((listing) => (
          <li key={listing.id}>
            <h3>{listing.title}</h3>
            <p>{listing.description}</p>
            <p>Location: {listing.location}</p>
            <p>Price: {listing.price}</p>
            <button onClick={() => handleRequestMatch(listing.id)}>
              Request Match
            </button>
          </li>
        ))}
      </ul>
      <Link to="/create-listing">Create New Listing</Link>
      <br />
      <Link to="/profile">View Profile</Link>
    </div>
  );
}
