import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { ref, push, update, get, onChildAdded } from "firebase/database";
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

  useEffect(() => {
    let unsubscribeReqAdded = null;
    let unsubscribeMatchAdded = null;

    try {
      unsubscribeReqAdded = onChildAdded(dbMatchReqRef, (snapshot) => {
        const data = snapshot.key;
        if (!matchRequestsIds.includes(data)) {
          setRequestIds((prev) => [...prev, data]);
          const matchRef = ref(db, "matches/" + data);
          get(matchRef).then((snap) => {
            if (snap.exists()) {
              const dbMatch = snap.val();
              setRequests((prev) => {
                const matchExists = prev.some((match) => match.key === dbMatch.key);
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

    try {
      unsubscribeMatchAdded = onChildAdded(dbMatchesRef, (snapshot) => {
        const data = snapshot.key;
        if (!data) return;
        const dbRef = ref(db, "matches/" + data);
        get(dbRef).then((snap) => {
          if (snap.val()) {
            setMatches((prev) => {
              const alreadyIn = prev.find((m) => m.key === data);
              if (!alreadyIn) return [...prev, snap.val()];
              return prev;
            });
          }
        });
      });
    } catch (err) {
      console.error("Error onChildAdded for match data:", err);
    }

    return () => {
      if (unsubscribeReqAdded) unsubscribeReqAdded();
      if (unsubscribeMatchAdded) unsubscribeMatchAdded();
    };
  }, [dbMatchReqRef, dbMatchesRef]);

  const handleApproveMatch = async (matchObj) => {
    await update(ref(db, "matches/" + matchObj.key), { approved: "true" });
    const ownerPath = "users/" + matchObj.owner + "/userMatchRequests/" + matchObj.key;
    const requesterPath = "users/" + matchObj.requester + "/userMatchRequests/" + matchObj.key;
    await update(ref(db), {
      [ownerPath]: null,
      [requesterPath]: null,
    });

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
      ["users/" + matchObj.requester + "/userMatches/" + matchObj.key]: matchObj.listingId,
    });
  };

  const handleContactOwner = (match, isOwner) => {
    let message = "";
    if (isOwner) {
      message = "Here is your sublet requester's email: " + match.requesterContact;
    } else {
      message = "Here is the sublet owner's email: " + match.ownerContact;
    }
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
      <div className="profile-header">
        <h2 className="profile-title">Your Profile</h2>
        <p className="profile-email">Email: {auth.currentUser.email}</p>
      </div>

      <div className="profile-section-grid">
        {/* 左边：你的 Listings Matches */}
        <div className="profile-card">
          <h3>Your Listings Matches</h3>

          <h4>Pending</h4>
          {matchRequests.filter((m) => m.owner === auth.currentUser.uid).length > 0 ? (
            matchRequests
              .filter((m) => m.owner === auth.currentUser.uid)
              .map((match) => (
                <div key={match.key} className="profile-item">
                  User {match.requester} wants to sublet your listing "{match.listingTitle}" at {match.listingLoc}
                  <button
                    className="profile-button"
                    onClick={() => handleApproveMatch(match)}
                  >
                    Approve
                  </button>
                </div>
              ))
          ) : (
            <p className="empty-message">No pending match requests</p>
          )}

          <h4>Approved</h4>
          {matches.filter((m) => m.owner === auth.currentUser.uid).length > 0 ? (
            matches
              .filter((m) => m.owner === auth.currentUser.uid)
              .map((match) => (
                <div key={match.key} className="profile-item">
                  You have approved a match with {match.requester} for listing "{match.listingTitle}" at {match.listingLoc}
                  <button
                    className="profile-button"
                    onClick={() => handleContactOwner(match, true)}
                  >
                    Contact
                  </button>
                </div>
              ))
          ) : (
            <p className="empty-message">No approved match requests</p>
          )}
        </div>

        {/* 右边：你的 Match Request Status */}
        <div className="profile-card">
          <h3>Your Match Request Status</h3>

          <h4>Pending</h4>
          {matchRequests.filter((m) => m.requester === auth.currentUser.uid).length > 0 ? (
            matchRequests
              .filter((m) => m.requester === auth.currentUser.uid)
              .map((match) => (
                <div key={match.key} className="profile-item">
                  Waiting on sublet owner's response for listing "{match.listingTitle}" at {match.listingLoc}
                </div>
              ))
          ) : (
            <p className="empty-message">No pending match requests</p>
          )}

          <h4>Approved</h4>
          {matches.filter((m) => m.requester === auth.currentUser.uid).length > 0 ? (
            matches
              .filter((m) => m.requester === auth.currentUser.uid)
              .map((match) => (
                <div key={match.key} className="profile-item">
                  Owner of listing "{match.listingTitle}" at {match.listingLoc} accepted your match
                  <button
                    className="profile-button"
                    onClick={() => handleContactOwner(match, false)}
                  >
                    Contact
                  </button>
                </div>
              ))
          ) : (
            <p className="empty-message">No approved match requests</p>
          )}
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
        onClose={onAlertClose}
        message={alertModalMessage}
      />
    </PageWrapper>
  );
}
