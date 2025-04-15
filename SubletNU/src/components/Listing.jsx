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
import { useAuth } from "../contexts/AuthContext";


function Listing({ setListings }) {
  const [listings, setLocalListings] = useState([]);
  const [matchRequests, setMatchReq] = useState([]);
  const [matches, setMatches] = useState([]);
  const pathLocation = useLocation();
  const pathname = pathLocation.pathname;

  //
  // if listing data exists, retrieve it and save the array to listings
  //
  useEffect(() => {
    const listingQuery =
      pathname === "/profile"
        ? query(
            ref(db, "users/" + auth.currentUser.uid + "/userListings"),
            orderByChild("createdAt")
          )
        : query(ref(db, "listings"), orderByChild("createdAt"));
    // const listingQuery = query(ref(db, 'listings'), orderByChild("createdAt"));
    const unsubscribe = onValue(
      listingQuery,
      (snapshot) => {
        if (snapshot.exists()) {
          const listingData = snapshot.val();
          const listingsArray = Object.entries(listingData).map(
            ([key, value]) => ({
              key, // db listing unique key
              ...value,
            })
          );
          setLocalListings(listingsArray);
          setListings(listingsArray);
        } else {
          console.log("No data avilable");
        }
      },
      (error) => {
        console.error("ERROR:" + error);
      }
    );


    return () => {
      unsubscribe();
    };
  }, [pathname, setListings]); // make it empty so it runs only once (?)



  //
  // Update listings
  //
  // if the listing belongs to the user they can update its db entry
  //
  const updateListing = (listing) => {
    // TODO
    // link to createlistingPage
    // extend that component page to handle an update
  };




  //
  // Handle match request
  //
  // allows a user to send a match request to the owner of a listing
  //
  // if current user is not the user who made the listing,
  // logs a matchRequest into the database
  const handleRequestMatch = async (listingId, owner) => {
    try {
      if (owner === auth.currentUser.uid) {
        // cant match with your own listing
        alert(
          "This user owns this listing. Can't match with a listing you own!"
        );
        return;
      }

      // construct match request
      const matchRequest = {
        listingId,
        requester: auth.currentUser.uid,
        owner,
        requestedAt: new Date(),
        approved: false,
      };

      // check if match already exists, if it does return

      // add match to matches

      const dbMatchRef = ref(db, "matches");
      const newMatchRef = push(dbMatchRef);
      const newMatchKey = newMatchRef.key;

      matchRequest.key = newMatchKey;
      console.log(matchRequest);

      await set(newMatchRef, matchRequest);

      // add matchid to owner and requestor's userMatchRequests Array
      const updates = {};
      const ownerMatchReqRef = ref(
        db,
        "/users/" + owner + "/userMatchRequests"
      );
      const userMatchReqRef = ref(
        db,
        "/users/" + auth.currentUser.uid + "/userMatchRequests"
      );

      // get the current lists
      const sanpshotOwner = await get(ownerMatchReqRef);
      const sanpshotUser = await get(userMatchReqRef);

      // update owners matchid list
      let currMatchReqsOwner = [];
      if (sanpshotOwner.exists()) {
        currMatchReqsOwner = sanpshotOwner.val();
      }

      if (!currMatchReqsOwner) {
        // list empty, create new list
        currMatchReqsOwner = [newMatchKey];
      } else if (!currMatchReqsOwner.includes(newMatchKey)) {
        // list exists, add the matchKey
        currMatchReqsOwner.push(newMatchKey);

        // add it to the updates object to update later
        updates["/users/" + owner + "/userMatchRequests"] = currMatchReqsOwner;
      }

      // update requestors/users matchreq list
      let currMatchReqsUser = [];
      if (sanpshotUser.exists()) {
        currMatchReqsUser = sanpshotUser.val();
      }

      if (!currMatchReqsUser) {
        // list empty, create new list
        currMatchReqsUser = [newMatchKey];
      } else if (!currMatchReqsUser.includes(newMatchKey)) {
        // list exists, add the matchKey
        currMatchReqsUser.push(newMatchKey);

        // add it to the updates object to update later
        updates["/users/" + auth.currentUser.uid + "/userMatchRequests"] =
          currMatchReqsUser;
      }

      // handle the updates
      await update(ref(db), updates);

      console.log("Match request added to user successfully.");
      // send notification/alert to listing owner
      // may not need to since it automatically updates

      alert("Match request sent!");
    } catch (error) {
      console.error("Error sending match request:", error);
    }
  };

  //
  // handleMatchChecking
  //
  // for each users' listing, checks for all pending matches and sends

  // if route is homepage: button is to start a match request
  // if route is profile: button is to update the listing
  return (
    <div
      style={{
        height: "500px",
        overflowY: "auto",
        boxSizing: "border-box",
        paddingBottom: "300px",
      }}
    >
      {listings.length === 0 
        ? <p>You have not made any sublet listings</p>
        :<ul style={{ margin: 0, padding: 0 }}>
            {listings.map((listing) => (
              <li
                key={listing.key}
                style={{
                  padding: "15px",
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
                      handleRequestMatch(listing.key, listing.createdBy)
                    }
                  >
                    Request Match
                  </button>
                ) : pathname === "/profile" ? (
                  <button onClick={() => updateListing(listing)}>
                    Update Listing
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        }
    </div>
  );
}

export default Listing;
