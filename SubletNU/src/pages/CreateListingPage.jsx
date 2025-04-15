import React, { useState } from "react";
import { db, auth } from "../firebase";
import { ref, push, update, child } from "firebase/database";
import { useNavigate } from "react-router-dom";
import "../css/createList.css";

export default function CreateListingPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isLocValid, setIsLocValid] = useState(true);
  const [price, setPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();



  const handleLocationChange = (e) => {
    const currLocation = e.target.value;
    const addressRegex = /^[0-9]+\s[A-Za-z0-9\s]+\s[A-Za-z\s]+\s[A-Za-z]{2}\s[0-9]{5}$/;
    setLocation(currLocation);

    // check if address has a valid street num, name, city, state and zip
    if (addressRegex.test(currLocation)){
      setIsLocValid(true);
    } else {
      setIsLocValid(false);
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Submitting data to Firebase Realtime Database...");

      // check that data is valid
      if (!isLocValid){
        setLocation("");
        alert("Please enter a valid address in the following format: 633 Clark St Evanston IL 60208");
        return;
      }



      // store each listing under listings/newListingKey
      // and users/currUser/userListings/newListingKey
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
    <div className="create-container">
      <div className="create-box">
        <h2 className="create-title">Create a New Listing</h2>
        <form onSubmit={handleSubmit} id='newListingForm' className="create-form">
          <input 
            type="text" 
            placeholder="Title" 
            id="title"
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
          <label htmlFor="start">Start Date:</label> 
          <input
            type="date"
            id="start"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate}
            required
          />
          <label htmlFor="end">End Date:</label> 
          <input
            type="date"
            id="end"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
            required
          />
          <textarea 
            placeholder="Description" 
            id="desc"
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            required 
          />
          <input 
            type="text" 
            placeholder="633 Clark St, Evanston, IL 60208" 
            id="location"
            value={location} 
            onChange={handleLocationChange} 
            required 
          />
          <input 
            type="number" 
            placeholder="Price" 
            id="price"
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
            required 
          />
          <button type="submit">Post Listing</button>
        </form>
      </div>
    </div>
  );
}
