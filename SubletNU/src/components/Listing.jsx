import React, { useState, useEffect } from "react";
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
  setSelectedMarker = () => {},
}) {
  const [listings, setLocalListings] = useState([]);
  const pathLocation = useLocation();
  const pathname = pathLocation.pathname;

  useEffect(() => {
    let listingQuery;
    if (showOnlyCurrentUser || pathname === "/profile") {
      listingQuery = query(
        ref(db, "users/" + auth.currentUser.uid + "/userListings"),
        orderByChild("createdAt")
      );
    } else {
      listingQuery = query(ref(db, "listings"), orderByChild("createdAt"));
    }

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
          );
          setLocalListings(listingsArray);
          setListings(listingsArray);
        } else {
          setLocalListings([]);
          setListings([]);
          console.log("No listings found.");
        }
      },
      (error) => {
        console.error("ERROR loading listings:", error);
      }
    );

    return () => unsubscribe();
  }, [pathname, showOnlyCurrentUser]);

  const handleRequestMatch = async (listing) => {
    try {
      const owner = listing.createdBy;
      const listingId = listing.key;
      const ownerContact = listing.contact;
      const listingLoc = listing.location;
      const listingTitle = listing.title;

      if (owner === auth.currentUser.uid) {
        setAlertModalMessage("You can't match with your own listing!");
        setAlertModal(true);
        return;
      }

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

      const matchRequest = {
        listingId,
        listingTitle,
        listingLoc,
        requester: auth.currentUser.uid,
        owner,
        ownerContact,
        requesterContact: auth.currentUser.email,
        requestedAt: new Date(),
        approved: false,
      };

      const newMatchRef = push(ref(db, "matches"));
      const matchKey = newMatchRef.key;
      matchRequest.key = matchKey;
      await set(newMatchRef, matchRequest);

      const updates = {};
      updates["/users/" + owner + "/userMatchRequests/" + matchKey] = listingId;
      updates["/users/" + auth.currentUser.uid + "/userMatchRequests/" + matchKey] = listingId;

      await update(ref(db), updates);

      setAlertModalMessage("Match request sent!");
      setAlertModal(true);

    } catch (error) {
      setAlertModalMessage("Failed to send match request.");
      setAlertModal(true);
      console.error("Error:", error);
    }
  };

  const updateListing = (listing) => {
    setEditingListing(listing);
    setIsUpdateModalOpen(true);
  };

  const handleSelectListing = (listing) => {
    if (listing.lat && listing.lng) {
      setSelectedMarker({
        lat: parseFloat(listing.lat),
        lng: parseFloat(listing.lng),
        ...listing,
      });
    }
  };

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

  return (
    <div className="listing-container">
      {filteredListings.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        filteredListings.map((listing) => (
          <div
            key={listing.key}
            className="listing-card"
            onClick={() => handleSelectListing(listing)}
          >
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
              <button
                className="listing-action-button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateListing(listing);
                }}
              >
                Update Listing
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default Listing;
