import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { ref, update } from "firebase/database";
import "../css/createList.css"; // Reuse the same styles

export default function UpdateListingModal({ 
  isOpen, 
  onClose, 
  listing, 
  setAlertModal, 
  setAlertModalMessage 
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isLocValid, setIsLocValid] = useState(true);
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (listing) {
      setTitle(listing.title || "");
      setDescription(listing.description || "");
      setLocation(listing.location || "");
      setPrice(listing.price || "");
      setStartDate(listing.startDate || "");
      setEndDate(listing.endDate || "");
    }
  }, [listing]);

  if (!isOpen) return null;

  const handleLocationChange = (e) => {
    const currLocation = e.target.value;
    const addressRegex = /^\d+\s+[\w\s.]+,?\s+[\w\s.]+,?\s+[A-Z]{2}\s+\d{5}$/;

    setLocation(currLocation);
    setIsLocValid(addressRegex.test(currLocation));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit clicked");

    if (!isLocValid) {
      setAlertModalMessage("Please enter a valid address (e.g. 633 Clark St Evanston IL 60208)");
      setAlertModal(true);
      return;
    }

    try {
      // Check if location changed
      let lat = listing.lat;
      let lng = listing.lng;

      if (location !== listing.location) {
        const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          location
        )}&format=json&limit=1`;
        const geoRes = await fetch(geoUrl, {
          headers: {
            "User-Agent": "sublet-nu-app/1.0 (minxin@northwestern.edu)",
          },
        });
        const geoData = await geoRes.json();
        console.log("Fetched geoData:", geoData);

        if (!geoData || geoData.length === 0) {
          setAlertModalMessage("Could not locate the new address. Please double-check and try again.");
          setAlertModal(true);
          return;
        }
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }

      const updatedListing = {
        ...listing,
        title,
        description,
        location,
        price,
        startDate,
        endDate,
        lat,
        lng,
      };

      const updates = {
        ["/listings/" + listing.key]: updatedListing,
        ["/users/" + listing.createdBy + "/userListings/" + listing.key]: updatedListing,
      };

      await update(ref(db), updates);
      setAlertModalMessage("Listing updated successfully!");
      setAlertModal(true);
      onClose();
    } catch (error) {
      console.error("Error updating listing:", error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2 className="create-title">Update Listing</h2>
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

          <button type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  );
}
