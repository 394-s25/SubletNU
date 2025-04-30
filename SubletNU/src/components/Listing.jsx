import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import {
  ref,
  push,
  onValue,
  orderByChild,
  query,
  set,
  get,
  update,
  serverTimestamp
} from "firebase/database";
import { useLocation } from "react-router-dom";
import UpdateListingModal from "./UpdateListingModal";

function Listing({
  setListings,
  filter,
  setAlertModal,
  setAlertModalMessage,
  isUpdateModalOpen,
  setIsUpdateModalOpen,
  editingListing,
  setEditingListing,
  showOnlyCurrentUser = false,
  selectedMarker = null,
  setSelectedMarker = () => { },
}) {
  const [listings, setLocalListings] = useState([]);
  const pathLocation = useLocation();
  const pathname = pathLocation.pathname;
  const listingsRefs = useRef({});

  useEffect(() => {
    let listingQuery;
    // Determine the query based on the current path
    if (showOnlyCurrentUser || pathname === "/profile") {
      listingQuery = query(
        ref(db, "users/" + auth.currentUser.uid + "/userListings"),
        orderByChild("createdAt")
      );
    } else {
      listingQuery = query(ref(db, "listings"), orderByChild("createdAt"));
    }

    // Listen for changes in the listings
    const unsubscribe = onValue(
      listingQuery,
      (snapshot) => {
        if (snapshot.exists()) {
          const listingData = snapshot.val();
          const listingsArray = Object.entries(listingData).map(
            ([key, value]) => ({
              key,
              ...value,
            })
          ).filter((listing) => {
            if (!showOnlyCurrentUser) {
              if (listing.createdBy !== auth.currentUser?.uid) return true;
              else return false;
            } else {
              if (listing.createdBy === auth.currentUser?.uid) return true;
              else return false;
            }
          });
          setLocalListings(listingsArray);
          setListings(listingsArray);
        } else {
          setLocalListings([]);
          setListings([]);
        }
      },
      (error) => {
        console.error("ERROR loading listings:", error);
      }
    );

    return () => unsubscribe();
  }, [pathname, showOnlyCurrentUser]);

  // Function to handle match request
  // This function is called when the user clicks on the "Request Match" button
  const handleRequestMatch = async (listing) => {
    try {
      const owner = listing.createdBy;
      const listingId = listing.key;
      const ownerContact = listing.contact;
      const listingLoc = listing.location;
      const listingTitle = listing.title;

      // Check if the user is trying to match with their own listing
      if (owner === auth.currentUser.uid) {
        setAlertModalMessage("You can't match with your own listing!");
        setAlertModal(true);
        return;
      }

      // Check if the user has already requested or matched this listing
      const requesterRef = ref(db, "users/" + auth.currentUser.uid + "/userMatchRequests");
      const requesterSnap = await get(requesterRef);
      if (requesterSnap.exists()) {
        const snapValues = Object.values(requesterSnap.val());
        const foundDuplicate = snapValues.some((id) => id === listingId);
        const matchSnap = await get(ref(db, "users/" + auth.currentUser.uid + "/userMatches"));
        const foundDuplicateMatch = matchSnap.exists() && Object.values(matchSnap.val()).some((id) => id === listingId);
        if (foundDuplicate || foundDuplicateMatch) {
          setAlertModalMessage("You already requested or matched this sublet.");
          setAlertModal(true);
          return;
        }
      }

      // Create the match request object
      const matchRequest = {
        listingId,
        listingTitle,
        listingLoc,
        requester: auth.currentUser.uid,
        owner,
        ownerContact,
        requesterContact: auth.currentUser.email,
        requestedAt: serverTimestamp(),
        approved: false,
        approvedAt: false
      };

      // Push the match request to the database
      const newMatchRef = push(ref(db, "matches"));
      const matchKey = newMatchRef.key;
      matchRequest.key = matchKey;
      await set(newMatchRef, matchRequest);

      // Update the user's match requests
      const updates = {};
      updates["/users/" + owner + "/userMatchRequests/" + matchKey] = listingId;
      updates["/users/" + auth.currentUser.uid + "/userMatchRequests/" + matchKey] = listingId;

      await update(ref(db), updates);

      // Show success message
      setAlertModalMessage("Match request sent!");
      setAlertModal(true);
    } catch (error) {
      console.error("Error sending match request:", error);
      setAlertModalMessage("Failed to send match request.");
      setAlertModal(true);
    }
  };

  // Function to update listing
  const updateListing = (listing) => {
    setEditingListing(listing);
    setIsUpdateModalOpen(true);
  };

  // Function to delete listing
  const handleDeleteListing = async (listingKey) => {
    try {
      const userId = auth.currentUser.uid;
      await set(ref(db, `listings/${listingKey}`), null);
      await set(ref(db, `users/${userId}/userListings/${listingKey}`), null);

      setAlertModalMessage("Listing deleted.");
      setAlertModal(true);
    } catch (error) {
      console.error("Error deleting listing:", error);
      setAlertModalMessage("Failed to delete listing.");
      setAlertModal(true);
    }
  };

  // Filter listings based on the search input
  const safeFilter = filter?.toLowerCase() || "";
  let filteredListings = listings.filter((listing) => {
    if (!showOnlyCurrentUser && listing.createdBy === auth.currentUser?.uid) {
      return false;
    }
    return Object.values(listing).some((value) => {
      if (typeof value === "string" || typeof value === "number") {
        return value.toString().toLowerCase().includes(safeFilter);
      }
      return false;
    });
  });

  // Function to handle listing selection
  const handleSelectListing = (listing, ref) => {
    if (listing.lat && listing.lng) {
      setSelectedMarker({
        lat: parseFloat(listing.lat),
        lng: parseFloat(listing.lng),
        ...listing,
      });
    }
    scrollIntoView(ref);
  };

  // Function to scroll into view
  const scrollIntoView = (ref) => {
    if (ref?.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Scroll to the selected marker when it changes
  useEffect(() => {
    if (selectedMarker) {
      if (listingsRefs.current[selectedMarker.key]?.current) {
        scrollIntoView(listingsRefs.current[selectedMarker.key]);
      }
    }
  }, [selectedMarker]);

  // Update listings when the filter changes
  useEffect(() => {
    if (filteredListings) updateListings(filteredListings);
  }, [filter]);

  const updateListings = (newListings) => {
    setListings(newListings);
  };

  return (
    <div className="listing-container">
      {filteredListings.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        filteredListings.map((listing) => {
          if (!listingsRefs.current[listing.key]) {
            listingsRefs.current[listing.key] = React.createRef();
          }

          return (
            <div
              key={listing.key}
              ref={listingsRefs.current[listing.key]}
              className={`listing-card ${selectedMarker?.key === listing.key ? "listing-active" : ""}`}
              onClick={() => handleSelectListing(listing, listingsRefs.current[listing.key])}
            >
              {/* // Display listing details */}
              <h3 className="listing-title">{listing.title || "No title"}</h3>
              <p className="listing-date">
                {listing.startDate} → {listing.endDate}
              </p>
              <p className="listing-location">
                📍 {listing.location || "Unknown"}
              </p>
              <p className="listing-price">
                💵 ${listing.price || "?"}/month
              </p>
              <p className="listing-description">
                {listing.description || "No description available"}
              </p>

              {pathname === "/" && !showOnlyCurrentUser ? (
                <button
                  className="listing-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRequestMatch(listing);
                  }}
                >
                  Request Match
                </button>
              ) : (pathname === "/profile" || showOnlyCurrentUser) && (
                <div className="listing-buttons">
                  <button
                    className="listing-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateListing(listing);
                    }}
                  >
                    Update
                  </button>
                  <button
                    className="listing-action-button delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteListing(listing.key);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      {/*  Update Listing Modal, having warning */}
      {isUpdateModalOpen && editingListing && (
        <UpdateListingModal
          isOpen={isUpdateModalOpen}
          listing={editingListing}
          onClose={() => setIsUpdateModalOpen(false)}
          setAlertModal={setAlertModal}
          setAlertModalMessage={setAlertModalMessage}
        />
      )}
    </div>
  );
}

export default Listing;
