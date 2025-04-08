import React, { useState } from "react";
import { db, auth } from "../firebase";
import { ref, push, update, child } from "firebase/database";
import { useNavigate } from "react-router-dom";
// import { start } from "repl";

export default function CreateListingPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();


  const handleStartDateRange = (e) => {
    const newStartDate = e.target.value;
    if (newStartDate && endDate && newStartDate >= endDate){
      // a start date and end date exists but start date is later than end date
      // reset start date and alert user
      setStartDate("");
      alert("Start date must occur before end date!")
    } else {
      setStartDate(newStartDate);
    }
  };

  const handleEndDateRange = (e) => {
    const newEndDate = e.target.value;
    if (newEndDate && startDate && newEndDate <= startDate){
      // a start date and end date exists but end date is starts before start date
      // reset start date and alert user
      setEndDate("");
      alert("End date must occur after start date!")
    } else {
      setEndDate(newEndDate);
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting data to Firestore...");
      // store each listing under userListings/$currentUser.uid
      // and listings
      const newListing = {
        title,
        description,
        location,
        price,
        startDate,
        endDate,
        createdBy: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      }


      const newListingKey = push(child(ref(db), "listings")).key;

      const updates = {};
      updates["/listings/" + newListingKey] = newListing;
      updates["/users/" + auth.currentUser.uid + "/userListings/" + newListingKey] = newListing;
      
      console.log("Listing successfully added...");
      navigate("/");
      return update(ref(db), updates);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div>
      <h2>Create a New Listing</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          placeholder="Title" 
          id="title"
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          required 
        />
        <br />
        <label>Start Date:</label> 
        <input
          type="date"
          id="start"
          value={startDate}
          onChange={handleStartDateRange}
          max={endDate}
          required
        />
        <br />
        <label>End Date:</label> 
        <input
          type="date"
          id="end"
          value={endDate}
          onChange={handleEndDateRange}
          min={startDate}
          required
        />
        <br />
        <textarea 
          placeholder="Description" 
          id="desc"
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          required 
        />
        <br />
        <input 
          type="text" 
          placeholder="Location" 
          id="location"
          value={location} 
          onChange={(e) => setLocation(e.target.value)} 
          required 
        />
        <br />
        <input 
          type="number" 
          placeholder="Price" 
          id="price"
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
          required 
        />
        <br />
        <button type="submit">Post Listing</button>
      </form>
    </div>
  );
}
