import React, { useState } from "react";
import { firestore, auth } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../css/createList.css"; // 

export default function CreateListingPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(firestore, "listings"), {
        title,
        description,
        location,
        price,
        createdBy: auth.currentUser.uid,
        createdAt: new Date(),
      });
      navigate("/");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div className="create-container">
      <div className="create-box">
        <h2 className="create-title">Create a New Listing</h2>
        <form onSubmit={handleSubmit} className="create-form">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Price"
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
