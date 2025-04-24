import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  ref,
  push,
  update,
  get,
  onChildAdded
} from "firebase/database";
import CreateListingModal from "../components/CreateListingModel";
import AlertModal from "../components/AlertModal";
import PageWrapper from "../components/PageWrapper";
import "../css/profile.css";

export default function ProfilePage() {
  const [matchRequests, setRequests] = useState([]);
  const [matchRequestsIds, setRequestIds] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAlertOpen, setAlertModal] = useState(false);
  const [alertModalMessage, setAlertModalMessage] = useState("");

  const dbMatchReqRef = ref(db, "users/" + auth.currentUser.uid + "/userMatchRequests");
  const dbMatchesRef = ref(db, "users/" + auth.currentUser.uid + "/userMatches");


  // render profile page with matches and then listen for added and rmeoved children
  useEffect(() => {
    let unsubscribeReqAdded = null;
    let unsubscribeMatchAdded = null;

    // listen for added match Requests
    try {
      unsubscribeReqAdded = onChildAdded(dbMatchReqRef, (snapshot) => {
        const data = snapshot.key; // the match key 

        // add all request ids that are not duplicates

        if (!matchRequestsIds.includes(data)){
          setRequestIds((prev) => [...prev, data]);

          // get corresponding match id
          const matchRef = ref(db, "matches/" + data);
          get(matchRef).then((snap) => {
            if (snap.exists()){
              const dbMatch = snap.val();
              setRequests((prev) => {
                const matchExists = prev.some((match) => match.key == dbMatch.key);
                if (!matchExists) return [...prev, dbMatch];
                return prev;
              });
              
            }
          });
        }

      });
    } catch (err) {
      console.error("Error onChildAdded for adding a new match req:", err);
    }


    // listen for new matches added
    try {
      unsubscribeMatchAdded = onChildAdded(dbMatchesRef, (snapshot) => {
        const data = snapshot.key; // new match key 
        if (!data) return;
        
        const dbRef = ref(db, "matches/" + data);
        get(dbRef).then((snap) => {
          if (snap.val()) { // snap.val() is the match
            setMatches((prev) => {
              const alreadyIn = prev.find((m) => m.key === data); //data is the new match key
              if (!alreadyIn) return [...prev, snap.val()];
              return prev;
            });
          }
        });
        
      });
    } catch (err) {
      console.error("Error onChildAdded for match data:", err);
    }
    

    // unsubscribe to all listeners
    return () => {
      if (unsubscribeReqAdded) unsubscribeReqAdded();
      if (unsubscribeMatchAdded) unsubscribeMatchAdded();
    }  

  }, [dbMatchReqRef, dbMatchesRef]); //on any change in the matches and match requests


  useEffect(() => {
    console.log("matches curr:",matches);
    console.log("requests curr:",matchRequests);

  }, [matches, matchRequests]);



  const handleApproveMatch = async (matchObj) => {
    update(ref(db, "matches/" + matchObj.key), { approved: "true" });

    const ownerPath = "users/" + matchObj.owner + "/userMatchRequests/" + matchObj.key;
    const requesterPath = "users/" + matchObj.requester + "/userMatchRequests/" + matchObj.key;

    await update(ref(db),{
      [ownerPath]: null,
      [requesterPath]: null
    });

    // add approved match to the requester and owner
    await updateMatch(matchObj);
    setMatches((prev) => [...prev, matchObj]);
    setRequestIds((prev) => prev.filter((item) => item !== matchObj.key));
    setRequests((prev) => prev.filter((item) => item.key !== matchObj.key));

    setAlertModalMessage("Match Approved. Email sent.");
    setAlertModal(true);
  };

  const updateMatch = async (matchObj) => {
    await update(ref(db), {
      ["users/" + matchObj.owner + "/userMatches/" + matchObj.key]: matchObj.listingId,
      ["users/" + matchObj.requester + "/userMatches/" + matchObj.key]: matchObj.listingId
    });
  };

  const handleContactOwner = (match, isOwner) => {
    let message = "";
    isOwner ? message = "Here is your sublet requester's email: " + match.requesterContact
      : message = "Here is the sublet owner's email: " + match.ownerContact;
    setAlertModalMessage(message);
    setAlertModal(true);
  };

  const onAlertClose = () => {
    setAlertModal(false);
    setAlertModalMessage("");
  };

  return (
    <PageWrapper
      onShowAll={() => {}}
      onShowUser={() => {}}
      onCreateNew={() => setIsCreateOpen(true)}
    >
      <h2 className="profile-title">Your Profile</h2>
      <p className="profile-email">Email: {auth.currentUser.email}</p>

      <h2>Your Listings Matches</h2>
      <h3>Pending</h3>
      
      {matchRequests.filter((match) => match.owner === auth.currentUser.uid).length > 0 ? (
        <ul>
          {matchRequests.map((match) => (
            <li key={match.key}>
              {match.owner === auth.currentUser.uid ? (
                <>
                  <p>User {match.requester} wants to sublet your listing "{match.listingTitle}" at {match.listingLoc}</p>
                  <button onClick={() => handleApproveMatch(match)}>Approve</button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (<p>No pending match requests</p>)}

      <h3>Approved</h3>
      {matches.filter((match) => match.owner === auth.currentUser.uid).length > 0 ? (
        <ul>
          {matches.map((match) => (
            <li key={match.key}>
              {match.owner === auth.currentUser.uid ? (
                <>
                  <p>You have approved a matching with {match.requester} for listing "{match.listingTitle}" at {match.listingLoc}</p>
                  <button onClick={() => handleContactOwner(match, true)}>Contact</button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (<p>No approved match requests</p>)}



      <h2>Your Match Request Status</h2>
      <h3>Pending</h3>
      {matchRequests.filter((match) => match.requester === auth.currentUser.uid).length > 0 ? (
        <ul>
          {matchRequests.map((match) => (
            <li key={match.key}>
              {match.requester === auth.currentUser.uid ? (
                <p>Waiting on sublet owner's response for listing "{match.listingTitle}" at {match.listingLoc}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (<p>No pending match requests</p>)}

      <h3>Approved</h3>
      {matches.filter((match) => match.requester === auth.currentUser.uid).length > 0 ? (
        <ul>
          {matches.map((match) => (
            <li key={match.key}>
              {match.requester === auth.currentUser.uid ? (
                <>
                  <p>Owner of listing "{match.listingTitle}" at {match.listingLoc} accepted your match</p>
                  <button onClick={() => handleContactOwner(match, false)}>Contact</button>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (<p>No approved match requests</p>)}


      <CreateListingModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <AlertModal isOpen={isAlertOpen} onClose={() => onAlertClose()} message={alertModalMessage}/>
    </PageWrapper>
  );
}
