import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Listing from "../components/Listing";
import PageWrapper from "../components/PageWrapper";
import CreateListingModal from "../components/CreateListingModel";
import AlertModal from "../components/AlertModal";
import TopAlert from "../components/TopAlert";
import LeafletMapBox from "../components/LeafletMapBox";
import { db, auth } from "../firebase";
import { ref, onValue } from "firebase/database"; 
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
  const [showTopAlert, setTopAlert] = useState(false);
  // ^to be used for filtering so user can see the listing they've just selected
  const dbMatchReqRef = ref(db, "users/" + auth.currentUser.uid + "/userMatchRequests");
  const dbMatchesRef = ref(db, "users/" + auth.currentUser.uid + "/userMatches");

  useEffect(() => {
    return onValue(dbMatchesRef, (snapshot) => {
      if (snapshot.exists()) setTopAlert(true);
    });

  }, [dbMatchesRef]);



  const onAlertClose = () => {
    setAlertModal(false);
    setAlertModalMessage("");
  };

  return (
    <div>
      
      {showTopAlert && (
        <TopAlert
          message="A new request or match has been made. Check your Profile for more information."
          type="info" // or "error"
          onClose={() => setTopAlert(false)}
        />
      )}

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
              placeholder="Search listing by keywords"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="home-input"
            />

            {showAllListings && (

              <Listing setListings={setListings} 
                        filter={filter} 
                        setAlertModal={setAlertModal} 
                        setAlertModalMessage={setAlertModalMessage}
                        selectedMarker={selectedMarker}/>

            )}

            {showUserListings && (
              <Listing setListings={setListings} 
                        showOnlyCurrentUser={true} 
                        setAlertModal={setAlertModal} 
                        setAlertModalMessage={setAlertModalMessage}
                        selectedMarker={selectedMarker} />
            )}
          
          </div>


          <div className="home-map-container">





            <LeafletMapBox
              setSelectedMarker={setSelectedMarker}
              listings={listings.filter((l) => l.lat && l.lng)
                .map((l) => ({
                  lat: parseFloat(l.lat),
                  lng: parseFloat(l.lng),
                  ...l,
                }))}
            />
            
          </div>
        </div>

        <CreateListingModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          setAlertModal={setAlertModal}
          setAlertModalMessage={setAlertModalMessage}
        />

        <AlertModal 
          isOpen={isAlertOpen} 
          onClose={() => onAlertClose()} 
          message={alertModalMessage}
        />

      </PageWrapper>
    </div>
  );
}
