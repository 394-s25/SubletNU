import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { ref, 
  remove,
  push,
  child, 
  update, 
  onValue, 
  get, 
  onChildAdded,
  onChildRemoved } from "firebase/database";
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

  //  listen for added match requests to approve or deny
  useEffect( () => {
    return onChildAdded(dbMatchReqRef, (snapshot) => {
      
      const data = snapshot.val();
      if (!matchRequestsIds.includes(data)){
        setRequestIds([...matchRequestsIds, data]);

        // get corresponding match request and display data
        const dbRef = ref(db,'matches/' + data);
        onValue(dbRef, (snap) => {
          if (snap.val()){
            setRequests([...matchRequests, snap.val()]);
          }
        }, error => {
          console.error("Error getting match data:", error);
        });
      };
    });

  }, [dbMatchReqRef]);

  // listen for removed requests
  useEffect(() => {
    return onChildRemoved(dbMatchReqRef, (snapshot) => {
      // update matchRequests and matchRequestsIds
      // by removing the child that got removed
      if (snapshot.val()){
        const data = snapshot.val();
        removeIdFromList(data.key);
        removeReqFromList(data.key);
      };
    });
  }, [dbMatchReqRef]);



  // listens for matches
  // listen for matches (that have been sent back)
  useEffect(() => {
    // check if a child has been added, update local matches state
    return onChildAdded(dbMatchesRef, (snapshot) => {
      // check if theres data
      if (!snapshot) return;
      const data = snapshot.val(); // the match id/key
      console.log("There is a new Match under this user");

      // check if matches already has this data
      // add it if it doesnt

      // get corresponding match request and display data
      const dbRef = ref(db,'matches/' + data);
      onValue(dbRef, (snap) => {
        if (snap.val()){
          // this match exists
          // check if matches already has this match
          for (const match of matches){
            if (match.key === data) return; //duplicate - don't add
          }
          // not in matches, add it
          setMatches([...matches, snap.val()]);
        }
      }, error => {
        console.error("Error getting match data:", error);
      });

    });
  }, [dbMatchesRef]);



  useEffect(() => {
    console.log("Match requests:",matchRequests);
    console.log("match ids:", matchRequestsIds);
    console.log("matches:", matches);
  }, [matchRequests]);


  

  const handleApproveMatch = async(matchObj) => {
    // change match approved to false
    update(ref(db, 'matches/' + matchObj.key), {
      approved: 'true'
    });
    alert("Match Request Approved. Sending user your contact email.");
    matchObj.approved = true;

    // remove the request from the matches for both the requester and the requestee
    try{
      // removing from requester
      const dbMatchReq = ref(db, 'users/' + matchObj.requester + '/userMatchRequests');
      const snapshotReq = await get(dbMatchReq);
      const reqs = snapshotReq.val();



      if (!reqs) {
        console.log("No match requests found.");
        // return;
      } else {

        const idx = Object.values(reqs).indexOf(matchObj.key);
        if (idx === -1){
          console.log("Value not found in match requests.");
        } else {
          // remove using index
          // console.log("Requester match request at index", idx);
          const removeRef = ref(db, 'users/' + matchObj.requester + '/userMatchRequests/' + idx);
          await remove(removeRef);
          // console.log("DB Match Request", matchObj.key, " at index",idx, "was removed for requester");
        }
      }

      //
      // remove from requestee/sublet owner 
      //
      const dbMatchOwnerRef = ref(db, 'users/' + matchObj.owner + '/userMatchRequests');
      const snapshotOwner = await get(dbMatchOwnerRef);
      const ownerVal = snapshotOwner.val();

      if (!ownerVal) {
        console.log("No match requests found.");
        // return;
      } else {
        const idxOwner = Object.values(ownerVal).indexOf(matchObj.key);
        if (idxOwner === -1){
          console.log("Value not found in match requests.");
        } else {
          // remove using index
          // console.log("Owner match request at index", idxOwner);
          const removeOwnerRef = ref(db, 'users/' + matchObj.owner + '/userMatchRequests/' + idxOwner);
          await remove(removeOwnerRef);
          // console.log("DB Match Request", matchObj.key, " at index",idxOwner, "was removed for sublet owner (requestee)");
        }
      }


      // update match in db
      await updateMatch(matchObj);

      // add to matches
      const newMatches = matchRequests.filter(item => item.key === matchObj.key);
      setMatches([...matches, ...newMatches]);

      // remove from the local match lists
      removeIdFromList(matchObj.key);
      removeReqFromList(matchObj.key);


    } catch (error) {
      console.error("Error removing match request:", error);
    }
  };


  // remove from the local lists
  const removeIdFromList = (key) => {
    setRequestIds(items => items.filter(item => item !== key));
  };
  

  const removeReqFromList = (key) => {
    setRequests(items => items.filter(item => item.key !== key));
  };

  const updateMatch = async (matchObj) => {
    // add match id to db matches under the requestee and the requesters 
    const dbSubletOwnerRef = ref(db, 'users/' + matchObj.owner + '/userMatches');
    const dbSubletRequestorRef = ref(db, 'users/' + matchObj.requester + '/userMatches');

    // add this match to their db lists
    const subletMatchOwnerRef = push(dbSubletOwnerRef, matchObj.key)
    const subletMatchReqRef = push(dbSubletRequestorRef, matchObj.key);
    console.log("push ref for owner (matches):",subletMatchOwnerRef.key, "(", dbSubletOwnerRef);
    console.log("push ref for request (matches):",subletMatchReqRef.key,"(", dbSubletRequestorRef);
  };

  const handleContactOwner = (match, isOwner) => {
    // send an alert to the user with the sublet owners contact info
    if (isOwner) alert("Here is your sublet requester's email: " + match.requesterContact);
    else alert("Here is the sublet owners email: " + match.ownerContact);
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
              {matchRequests.map((match) => {
                if (match.owner !== auth.currentUser.uid){ //not the users sublet listing
                  return <li key={match.key}>
                          <p>Waiting on sublet owner's response for sublet {match.listingId}</p>
                        </li>
                } else {
                  return <li key={match.key}>
                    <p>User {match.requester} wants to sublet your listing {match.listingId}</p>
                    <button onClick={() => handleApproveMatch(match)}>Approve</button>
                  </li>
                }
              })}
            </ul>
            : <p>No match requests</p>}

          <h3>Responses/Matches</h3>
          {matches.length !==0 ? 
            <ul>
              {matches.map((match) => {
                if (match.owner === auth.currentUser.uid){
                  return <li key={match.key}>
                          <p>Sublet Match! You have matched with user {match.requester} for your sublet {match.listingId}</p>
                          <button onClick={() => handleContactOwner(match, false)}>Contact</button>
                        </li>
                } else {
                  return <li key={match.key}>
                            <p>Sublet Match! The owner of sublet {match.listingId} wants to sublet to you.</p>
                            <button onClick={() => handleContactOwner(match, true)}>Contact</button>
                          </li>
                }
              })}
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
