import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { ref, remove, update, onValue, get, onChildAdded } from "firebase/database";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Listing from "../components/Listing";
import "../css/profile.css"; 

export default function ProfilePage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [listings, setListings] = useState([]);
  const [matchRequests, setRequests] = useState([]);
  const [matchRequestsIds, setRequestIds] = useState([]);
  const [matches, setMatches] = useState([]);
  const dbMatchReqRef = ref(db, 'users/' + auth.currentUser.uid + '/userMatchRequests');
  const dbMatchesRef = ref(db, 'users/' + auth.currentUser.uid + '/userMatches');

  //  listen for match requests to approve or deny
  useEffect( () => {
    return onChildAdded(dbMatchReqRef, (snapshot) => {
      // console.log("Current matches:", matchRequestsIds);
      // console.log("match req added:", snapshot.val());
      const data = snapshot.val();
      if (!matchRequestsIds.includes(data)){
        // console.log("match req added:", data);
        setRequestIds([...matchRequestsIds, data]);
        // get corresponding match request and display data
        const dbRef = ref(db,'matches/' + data);
        onValue(dbRef, (snap) => {
          if (snap.val()){
            // console.log("getting match data:", snap.val());
            setRequests([...matchRequests, snap.val()]);
          }
        }, error => {
          console.error("Error getting match data:", error);
        });
      };
    });

  }, [dbMatchReqRef]);

  useEffect(() => {
    console.log("Match requests:",matchRequests);
    console.log("match id:", matchRequestsIds);
  }, [matchRequests]);

  // listen for matches (that have been sent back)

  const handleApproveMatch = async(key) => {
    // change match approved to false
    update(ref(db, 'matches/' + key), {
      approved: 'true'
    });
    alert("Match Request Approved. Sending user your contact email.");
    // remove the request from the matches/
    try{
      const snapshot = await get(dbMatchReqRef);
      const reqs = snapshot.val();

      if (!reqs) {
        console.log("No match requests found.");
        return;
      }

      const idx = Object.values(reqs).indexOf(key);
      if (idx === -1){
        console.log("Value not found in match requests.");
      }

      // remove using index
      const removeRef = ref(db, 'users/' + auth.currentUser.uid + '/userMatchRequests/' + idx);
      await remove(removeRef);
      console.log("DB Match Request", key, " at index",idx, "was removed");

      // add to matches
      const newMatches = matchRequests.filter(item => item.key === key);
      // const filteredMatches = newMatches.filter(item => !matches.includes(item));
      setMatches([...matches, ...newMatches]);

      // remove from the local match lists
      removeIdFromList(key);
      removeReqFromList(key);


    } catch (error) {
      console.error("Error rmeoving match request:", error);
    }
  };

  // remove from the local lists
  const removeIdFromList = (key) => {
    setRequestIds(items => items.filter(item => item !== key));
  };

  const removeReqFromList = (key) => {
    setRequests(items => items.filter(item => item.key !== key));
  };


  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <div className="profile-container">
      <div className="profile-box">
        <h2 className="profile-title">Your Profile</h2>
        <p className="profile-email">Email: {auth.currentUser.email}</p>
        <button className="logout-button" onClick={handleLogout}>
          Log Out
        </button>
        <div>
          <h2>Notifications</h2>
          <h3>Open Match Requests</h3>
          {matchRequests.length !==0 ? 
            <ul>

              {matchRequests.map((match) => (
                <li key={match.key}>
                  <p>User {match.requester} wants to sublet your listing {match.listingId}</p>
                  <button onClick={() => handleApproveMatch(match.key)}>Approve</button>
                </li>
              ))}
            </ul>
            : <p>No match requests</p>}

          <h3>Responses/Matches</h3>
          {matches.length !==0 ? 
            <ul>
              {matches.map((match) => (
                <li key={match.key}>
                  <p>Sublet Match! The owner of sublet {match.listingId} wants to sublet to you.</p>
                  <button>Contact</button>
                </li>
              ))}
            </ul>
            : <p>No matches</p>}
        </div>
        <div>
            <h2>Your Listings</h2>
            <Listing setListings={setListings}/>  
        </div>
      </div>
    </div>
  );
}
