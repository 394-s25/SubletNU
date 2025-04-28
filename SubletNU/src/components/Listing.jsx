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


function Listing({ setListings, filter, setAlertModal, setAlertModalMessage, showOnlyCurrentUser = false, selectedMarker= null }) {

  const [listings, setLocalListings] = useState([]);
  const pathLocation = useLocation();
  const pathname = pathLocation.pathname;

  //  Fetch listings from DB
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


  //  Request a match
  const handleRequestMatch = async (listing) => {
    try {
      const owner = listing.createdBy;
      const listingId = listing.key;
      const ownerContact = listing.contact;
      const listingLoc = listing.location;
      const listingTitle = listing.title;
      // sublet owner can't request their own sublet
      if (owner === auth.currentUser.uid) {
        setAlertModalMessage("You can't match with your own listing!");
        setAlertModal(true);
        return;
      }

      // check if this match has been requested before
      // it has been requested before if, there exists a matchRequest under 
      //    this user that has this listingId

      const requesterRef = ref(db, "users/" + auth.currentUser.uid + "/userMatchRequests");
      try {
        // get the corresponding match
        const requesterSnap = await get(requesterRef);
        if (requesterSnap.exists()){
          // userMatchRequest are in the format matchKey : listingId
          // check the values for duplicates
          const snapValues = Object.values(requesterSnap.val());
          const foundDuplicate = snapValues.some(id => id === listingId);
          let foundDuplicateMatch = false;
          const matchSnap = await get(ref(db, "users/" + auth.currentUser.uid + "/userMatches"));
          if (matchSnap.exists()) foundDuplicateMatch = Object.values(matchSnap.val()).some(id => id === listingId);
          if (foundDuplicate || foundDuplicateMatch){
            setAlertModalMessage("A request or match has alreay been made for this sublet. Check your profile for request responses!");
            setAlertModal(true);
            return;
          } 
        }
      } catch (err) {
        console.error("Error getting userMatchRequest data:", err);
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

      // update user matchRequest references
      const updates = {};


      updates["/users/" + owner + "/userMatchRequests/" + matchKey] = listingId;
      updates["/users/" + auth.currentUser.uid + "/userMatchRequests/" + matchKey] = listingId;

      update(ref(db), updates)
        .then(async() => {
            console.log("Match added successfully", matchKey);
        })
        .catch((error) => console.error("Error updating db with match:", error));


      setAlertModalMessage("Match request sent!");
      setAlertModal(true);

    } catch (error) {
      setAlertModalMessage("Match Request could not be sent.");
      setAlertModal(true);
      console.error("Error sending match request:", error);
    }
  };




  const updateListing = (listing) => {
    const message = "Listing update coming soon! ID: " + listing.key;
    setAlertModalMessage(message);
    setAlertModal(true);
    // Optional: Redirect to edit page or open form
  };

  //
  // Filtering the Listings
  //

  // console.log("Listings", listings); // 👈 This prints the key
  const safeFilter = filter?.toLowerCase() || "";

  let filteredListings = listings.filter((listing) => {
    // skip own listings
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

  // if a marker is selected, move it to the top of the filtered list
  const moveToTop = (array, listing) => {
    const idx = array.findIndex((element) => element.key == listing.key);
    if (idx > -1) { //  found  
      const [item] = array.splice(idx, 1); // remove item
      array.unshift(item);
    } 
    return array;
  };

  useEffect(() => {
    // console.log("filtered:", filteredListings);
    if (filteredListings) updateListings(filteredListings);
  }, [filter]);

  const updateListings= (newListings) => {
    setListings(newListings);
  }

  // update marker
  useEffect(() => {
    if (selectedMarker){ 
      const shiftedArray = moveToTop(filteredListings,selectedMarker);
      setLocalListings(shiftedArray);
      setListings(shiftedArray);
      // scroll to top of page to see the selected listing
      scrollToTop();
    }
  }, [selectedMarker]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 10,
      behavior: "smooth"
    });
  };


  // 🔽 UI
  return (
    <div
      style={{
        height: "500px",
        overflowY: "auto",
        boxSizing: "border-box",
        paddingBottom: "300px",
      }}
    >
      {listings.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0 }}>
          {filteredListings.map((listing) => (
            <li
              key={listing.key}
              style={{
                padding: "10px",
                borderBottom: "1px solid #eee",
              }}
            >
              <h3>{listing.title || "No title"}</h3>
              <p>
                {listing.startDate} to {listing.endDate}
              </p>
              <p>Location: {listing.location || "Unknown"}</p>
              <p>Price: ${listing.price || "?"}/month</p>
              <p>{listing.description || "No description"}</p>

              {pathname === "/" && !showOnlyCurrentUser ? (
                <button
                  onClick={() =>
                    handleRequestMatch(listing)
                  }
                >
                  Request Match
                </button>
              ) : pathname === "/profile" || showOnlyCurrentUser ? (
                <button onClick={() => updateListing(listing)}>
                  Update Listing
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Listing;
