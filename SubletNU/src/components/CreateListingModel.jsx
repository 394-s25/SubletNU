import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { ref, push, update, child } from "firebase/database";
import "../css/createList.css";

export default function CreateListingModal({ isOpen, onClose }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isLocValid, setIsLocValid] = useState(true);
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!isOpen) return null;


  const handleLocationChange = (e) => {
    const currLocation = e.target.value;
    const addressRegex = /^\d+\s+[\w\s.]+,?\s+[\w\s.]+,?\s+[A-Z]{2}\s+\d{5}$/;

    setLocation(currLocation);
    setIsLocValid(addressRegex.test(currLocation));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLocValid) {
      alert("Please enter a valid address (e.g. 633 Clark St Evanston IL 60208)");
      return;
    }

    try {
      // Fetch geolocation from Nominatim
      const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        location
      )}&format=json&limit=1`;
      const geoRes = await fetch(geoUrl, {
        headers: {
          "User-Agent": "sublet-nu-app/1.0 (minxin@northwestern.edu)",
        },
      });
      const geoData = await geoRes.json();
      if (!geoData || geoData.length === 0) {
        alert(
          "Could not locate the address. Please double-check and try again."
        );
        return;
      }

      const lat = parseFloat(geoData[0].lat);
      const lng = parseFloat(geoData[0].lon);

      const newListing = {
        title,
        description,
        location,
        price,
        startDate,
        endDate,
        lat,
        lng,
        createdBy: auth.currentUser.uid,
        contact: auth.currentUser.email,
        createdAt: new Date().toISOString(),
      };

      const newListingKey = push(child(ref(db), "listings")).key;
      const updates = {
        ["/listings/" + newListingKey]: newListing,
        ["/users/" + auth.currentUser.uid + "/userListings/" + newListingKey]:
          newListing,
      };

      await update(ref(db), updates);
      alert("Listing posted successfully!");
      onClose();
    } catch (error) {
      console.error("Error posting listing:", error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2 className="create-title">Create a New Listing</h2>
        <form onSubmit={handleSubmit} className="create-form">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
            required
          />
          <label>End Date:</label>

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="633 Clark St Evanston IL 60208"
            value={location}
            onChange={handleLocationChange}
            required
          />
          <input
            type="number"
            placeholder="Monthly Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            required
          />

          <button type="submit">Post Listing</button>
        </form>
      </div>
    </div>
  );
}
