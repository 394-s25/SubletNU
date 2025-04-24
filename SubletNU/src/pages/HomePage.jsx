import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Listing from "../components/Listing";
import PageWrapper from "../components/PageWrapper";
import CreateListingModal from "../components/CreateListingModel";
import AlertModal from "../components/AlertModal";
import LeafletMapBox from "../components/LeafletMapBox";
import { db } from "../firebase";
import { ref, get } from "firebase/database"; // ✅ 使用 get 而非 onValue
import "../css/home.css";

export default function HomePage() {
  const [filter, setFilter] = useState("");
  const [listings, setListings] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [showAllListings, setShowAllListings] = useState(true);
  const [showUserListings, setShowUserListings] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAlertOpen, setAlertModal] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState("");
  const [selectedMarker, setSelectedMarker] = useState({}); 
  // ^to be used for filtering so user can see the listing they've just selected

  const filteredListings = listings.filter(
    (listing) =>
      listing.location?.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    console.log("Home page selected marker:", selectedMarker);
  },[selectedMarker]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const snapshot = await get(ref(db, "/listings"));
        if (snapshot.exists()) {
          const data = snapshot.val();
          const listingsArray = Object.entries(data).map(([key, value]) => ({
            key,
            ...value,
          }));
          setListings(listingsArray);

          const markers = listingsArray
            .filter((l) => l.lat && l.lng)
            .map((l) => ({
              lat: parseFloat(l.lat),
              lng: parseFloat(l.lng),
              ...l,
            }));
          setMapMarkers(markers);
        } else {
          console.warn("No listings found.");
        }
      } catch (err) {
        console.error("Failed to fetch listings:", err);
      }
    };

    fetchListings(); // ✅ 只执行一次
  }, []);

  const onAlertClose = () => {
    setAlertModal(false);
    setAlertModalMessage("");
  };

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
            <Listing setListings={setListings} setAlertModal={setAlertModal} setAlertModalMessage={setAlertModalMessage}/>
          )}

          {showUserListings && (
            <Listing setListings={setListings} setAlertModal={setAlertModal} setAlertModalMessage={setAlertModalMessage} showOnlyCurrentUser={true} />
          )}
        
        </div>


        <div className="home-map-container">




          <LeafletMapBox
            setSelectedMarker={setSelectedMarker}
            listings={mapMarkers.filter((l) =>
              l.location?.toLowerCase().includes(filter.toLowerCase())
            )}
          />
        </div>
      </div>

      <CreateListingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <AlertModal 
        isOpen={isAlertOpen} 
        onClose={() => onAlertClose()} 
        message={alertModalMessage}
      />
    </PageWrapper>
  );
}
