import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import Listing from "../components/Listing";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // 引入样式
import "../css/home.css"; // 


export default function HomePage() {
  const [filter, setFilter] = useState("");


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
          <div>
              <Listing />
          </div>
        </div>


        <div className="home-right">

          <MapContainer
            center={[42.055984, -87.675171]

            }
            zoom={15}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* {filteredListings.map((listing) => (
              <Marker
                key={listing.id}
                position={[listing.lat || 41.8781, listing.lng || -87.6298]} // 👈 你需要在数据库里加 lat/lng 字段
              >
                <Popup>
                  <strong>{listing.title}</strong>
                  <br />
                  {listing.location}
                </Popup>
              </Marker>
            ))} */}
          </MapContainer>
        </div>
      </div>
    </div>
  );


}
