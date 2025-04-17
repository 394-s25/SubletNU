import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Listing from "../components/Listing";
import PageWrapper from "../components/PageWrapper";
import CreateListingModal from "../components/CreateListingModel";
import LeafletMapBox from "../components/LeafletMapBox";
import "../css/home.css";

export default function HomePage() {
  const [filter, setFilter] = useState("");
  const [listings, setListings] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [showAllListings, setShowAllListings] = useState(true);
  const [showUserListings, setShowUserListings] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredListings = listings.filter(
    (listing) =>
      listing.location?.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    const fetchCoordinates = async () => {
      const results = [];
      for (const listing of listings) {
        if (!listing.location) continue;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          listing.location
        )}&format=json&limit=1`;
        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'sublet-nu-app/1.0 (minxin@northwestern.edu)',
            },
          });
          const data = await res.json();
          if (data.length > 0) {
            results.push({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              ...listing,
            });
          }
        } catch (err) {
          console.error("Geocode failed for:", listing.location, err);
        }
      }
      setMapMarkers(results);
    };

    if (listings.length > 0) fetchCoordinates();
  }, [listings]);

  return (
    <PageWrapper
      onShowAll={() => {
        setShowAllListings(true);
        setShowUserListings(false);
      }}
      onShowUser={() => {
        setShowAllListings(false);
        setShowUserListings(true);
      }}
      onCreateNew={() => setIsCreateOpen(true)}
    >
      <div className="home-layout">
        <div className="home-left">
          <h2 className="home-title">Sublet Listings</h2>
          <input
            type="text"
            placeholder="Filter by location"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="home-input"
          />

          {showAllListings && (
            <Listing setListings={setListings} />
          )}

          {showUserListings && (
            <Listing setListings={setListings} showOnlyCurrentUser={true} />
          )}
        </div>

        <div className="home-map-container">
          <LeafletMapBox listings={mapMarkers} />
        </div>
      </div>

      <CreateListingModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </PageWrapper>
  );
}
