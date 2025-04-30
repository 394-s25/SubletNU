import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Listing from "../components/Listing";
import PageWrapper from "../components/PageWrapper";
import CreateListingModal from "../components/CreateListingModel";
import AlertModal from "../components/AlertModal";
import TopAlert from "../components/TopAlert";
import LeafletMapBox from "../components/LeafletMapBox";
import { db, auth } from "../firebase";
import { ref, onValue, get, onChildAdded, serverTimestamp } from "firebase/database";
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
  const [selectedMarker, setSelectedMarker] = useState({}); // to be used for filtering so user can see the listing they've just selected
  const [showTopAlert, setTopAlert] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("A new request or match has been made. Check your Profile for more information.");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);

  const dbMatchReqRef = ref(db, "users/" + auth.currentUser.uid + "/userMatchRequests");
  const dbMatchesRef = ref(db, "users/" + auth.currentUser.uid + "/userMatches");
  let initTimeRef = useRef(Date.now()); //current timestamp

  useEffect(() => {
    const unsubscribe = onChildAdded(dbMatchesRef, async (snapshot) => {
      if (snapshot.exists()){
        const checkIfNew = await checkForNewEntry(snapshot.key, true);
        if (checkIfNew){
          setBannerMessage("A match has been approved for a sublet you requested. Check your Profile for more information.");
          setTopAlert(true);
        }
      }
    });

    return () => unsubscribe();
  }, [dbMatchesRef]);

  useEffect(() => {
    const unsubscribe = onChildAdded(dbMatchReqRef, async (snapshot) => {
      if (snapshot.exists()){ 
        const checkIfNew = await checkForNewEntry(snapshot.key, false);
        if (checkIfNew){
          setBannerMessage("A new request has been made for one of your sublet listings. Check your Profile for more information.");
          setTopAlert(true);
        }
      }
    });

    return () => unsubscribe();
  }, [dbMatchReqRef]);

  const checkForNewEntry = async (snapshot, isMatch) => {
    // check its timestamp against the current timestamp
    // retrieve the listing
    const snap = await get(ref(db, "matches/" + snapshot));
    const data = snap.exists() ? snap.val() : null; 

    if (isMatch && data){
      // checking if the match has been updated
      return data.approvedAt;
    } else {
      // looking at req data
      if (data && data.requestedAt && data.owner === auth.currentUser.uid) {
        const createdAt = data.requestedAt;
        const isServerTimestamp = typeof createdAt === "object" && createdAt.hasOwnProperty("seconds");
        const createdTime = isServerTimestamp ? createdAt.seconds * 1000 : createdAt;
        

        return createdTime > initTimeRef.current;
      }
    }
    return false;
  };




  const onAlertClose = () => {
    setAlertModal(false);
    setAlertModalMessage("");
  };

  const onBannerClose = () => {
    setTopAlert(false);
    initTimeRef.current = Date.now(); //update timestamp
  }

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
        {/* left part */}
        <div className="home-left">
          {/* header */}
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

          {/* we can use this to show the listings that are filtered by the search bar */}
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

        {/* map part */}
        <div className="home-map-container">
          <LeafletMapBox
            setSelectedMarker={setSelectedMarker}
            selectedMarker={selectedMarker}
            listings={listings.filter((l) => l.lat && l.lng)
              .map((l) => ({
                lat: parseFloat(l.lat),
                lng: parseFloat(l.lng),
                ...l,
              }))}
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

      {/* // Top Alert */}
      {showTopAlert && (
        <TopAlert
          message={bannerMessage}
          type="info" // or "error"
          onClose={() => onBannerClose()}
        />
      )}

    </PageWrapper>

  );
}
