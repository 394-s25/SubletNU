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

function Listing({ setListings, showOnlyCurrentUser = false }) {
  const [listings, setLocalListings] = useState([]);
  const pathLocation = useLocation();
  const pathname = pathLocation.pathname;

  // 🔁 Fetch listings from DB
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
  }, [pathname, setListings, showOnlyCurrentUser]);

  // 🔁 Request a match
  const handleRequestMatch = async (listingId, owner, ownerContact) => {
    try {
      if (owner === auth.currentUser.uid) {
        alert("You can't match with your own listing!");
        return;
      }

      const matchRequest = {
        listingId,
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

      const ownerRef = ref(db, "users/" + owner + "/userMatchRequests");
      const requesterRef = ref(db, "users/" + auth.currentUser.uid + "/userMatchRequests");

      const [ownerSnap, requesterSnap] = await Promise.all([
        get(ownerRef),
        get(requesterRef)
      ]);

      const ownerList = ownerSnap.exists() ? ownerSnap.val() : [];
      const requesterList = requesterSnap.exists() ? requesterSnap.val() : [];

      if (!ownerList.includes(matchKey)) {
        ownerList.push(matchKey);
        updates["/users/" + owner + "/userMatchRequests"] = ownerList;
      }

      if (!requesterList.includes(matchKey)) {
        requesterList.push(matchKey);
        updates["/users/" + auth.currentUser.uid + "/userMatchRequests"] = requesterList;
      }

      await update(ref(db), updates);

      alert("Match request sent!");
    } catch (error) {
      console.error("Error sending match request:", error);
    }
  };

  const updateListing = (listing) => {
    alert("Listing update coming soon! ID: " + listing.key);
    // Optional: Redirect to edit page or open form
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
          {listings.map((listing) => (
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

              {pathname === "/" ? (
                <button
                  onClick={() =>
                    handleRequestMatch(
                      listing.key,
                      listing.createdBy,
                      listing.contact
                    )
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
