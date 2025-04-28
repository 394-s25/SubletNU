import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Listing from "../components/Listing";
import PageWrapper from "../components/PageWrapper";
import CreateListingModal from "../components/CreateListingModel";
import AlertModal from "../components/AlertModal";
import LeafletMapBox from "../components/LeafletMapBox";
import { db } from "../firebase";
import { ref, get } from "firebase/database";
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
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      updateMarkers();
    }, 2000);
    return () => clearTimeout(delayTimer);
  }, [listings]);

  const updateMarkers = () => {
    try {
      const markers = listings
        .filter((l) => l.lat && l.lng)
        .map((l) => ({
          lat: parseFloat(l.lat),
          lng: parseFloat(l.lng),
          ...l,
        }));
      setMapMarkers(markers);
    } catch (err) {
      console.error("Failed to map markers:", err);
    }
  };

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
        {/* 左侧部分 */}
        <div className="home-left">
          {/* 固定在顶部 */}
          <div className="home-left-header">
            <h2 className="home-title">Sublet Listings</h2>
            <input
              type="text"
              placeholder="Search listing by keywords"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="home-input"
            />
          </div>

          {/* 可以滚动 */}
          <div className="home-left-list">
            {showAllListings && (
              <Listing
                setListings={setListings}
                filter={filter}
                setAlertModal={setAlertModal}
                setAlertModalMessage={setAlertModalMessage}
                selectedMarker={selectedMarker}
                setSelectedMarker={setSelectedMarker}
                listingWrapperClass="listing-card"
              />
            )}
            {showUserListings && (
              <Listing
                setListings={setListings}
                showOnlyCurrentUser={true}
                setAlertModal={setAlertModal}
                setAlertModalMessage={setAlertModalMessage}
                selectedMarker={selectedMarker}
                
                isUpdateModalOpen={isUpdateModalOpen}
                setIsUpdateModalOpen={setIsUpdateModalOpen}
                editingListing={editingListing}
                setEditingListing={setEditingListing}
                setSelectedMarker={setSelectedMarker}
                listingWrapperClass="listing-card"
              />
            )}
          </div>
        </div>

        {/* 地图部分 */}
        <div className="home-map-container">
          <LeafletMapBox
            setSelectedMarker={setSelectedMarker}
            selectedMarker={selectedMarker}
            listings={mapMarkers.filter((l) =>
              l.location?.toLowerCase().includes(filter.toLowerCase())
            )}
          />
        </div>
      </div>

      {/* Create Modal */}
      <CreateListingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        setAlertModal={setAlertModal}
        setAlertModalMessage={setAlertModalMessage}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={isAlertOpen}
        onClose={onAlertClose}
        message={alertModalMessage}
      />
    </PageWrapper>
  );
}
