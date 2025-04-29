import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { ref, update, get, onChildAdded } from "firebase/database";
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

  const dbMatchReqRef = ref(
    db,
    "users/" + auth.currentUser.uid + "/userMatchRequests"
  );
  const dbMatchesRef = ref(db, "users/" + auth.currentUser.uid + "/userMatches");

  useEffect(() => {
    let unsubscribeReqAdded = null;
    let unsubscribeMatchAdded = null;

    try {
      unsubscribeReqAdded = onChildAdded(dbMatchReqRef, (snap) => {
        const key = snap.key;
        if (!matchRequestsIds.includes(key)) {
          setRequestIds((prev) => [...prev, key]);
          get(ref(db, "matches/" + key)).then((s) => {
            if (s.exists()) {
              const match = s.val();
              setRequests((prev) =>
                prev.find((m) => m.key === match.key) ? prev : [...prev, match]
              );
            }
          });
        }
      });
    } catch (err) {
      console.error("Error onChildAdded for match requests:", err);
    }

    try {
      unsubscribeMatchAdded = onChildAdded(dbMatchesRef, (snap) => {
        const key = snap.key;
        if (key) {
          get(ref(db, "matches/" + key)).then((s) => {
            const match = s.val();
            if (match) {
              setMatches((prev) =>
                prev.find((m) => m.key === key) ? prev : [...prev, match]
              );
            }
          });
        }
      });
    } catch (err) {
      console.error("Error onChildAdded for match data:", err);
    }

    return () => {
      if (unsubscribeReqAdded) unsubscribeReqAdded();
      if (unsubscribeMatchAdded) unsubscribeMatchAdded();
    };
  }, [dbMatchReqRef, dbMatchesRef, matchRequestsIds]);

  const handleApproveMatch = async (matchObj) => {
    await update(ref(db, "matches/" + matchObj.key), { approved: "true" });
    const ownerPath = `users/${matchObj.owner}/userMatchRequests/${matchObj.key}`;
    const requesterPath = `users/${matchObj.requester}/userMatchRequests/${matchObj.key}`;

    await update(ref(db), {
      [ownerPath]: null,
      [requesterPath]: null
    });

    await update(ref(db), {
      [`users/${matchObj.owner}/userMatches/${matchObj.key}`]: matchObj.listingId,
      [`users/${matchObj.requester}/userMatches/${matchObj.key}`]: matchObj.listingId
    });

    setMatches((prev) => [...prev, matchObj]);
    setRequestIds((prev) => prev.filter((id) => id !== matchObj.key));
    setRequests((prev) => prev.filter((m) => m.key !== matchObj.key));

    setAlertModalMessage("Match Approved. Email sent.");
    setAlertModal(true);
  };

  const handleContactOwner = (match, isOwner) => {
    const message = isOwner
      ? `Here is your sublet requester's email: ${match.requesterContact}`
      : `Here is the sublet owner's email: ${match.ownerContact}`;
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
      <p className="profile-email">
        Email: {auth.currentUser.email}
      </p>

      {/* ←── Small “Add a Listing” button ──→ */}
      <button
        className="add-listing-button small"
        onClick={() => setIsCreateOpen(true)}
      >
        + Add a Listing
      </button>

      <h2>Your Listings Matches</h2>
      <h3>Pending</h3>
      {matchRequests.filter((m) => m.owner === auth.currentUser.uid).length > 0 ? (
        <ul>
          {matchRequests.map((match) =>
            match.owner === auth.currentUser.uid ? (
              <li key={match.key}>
                <p>
                  User {match.requester} wants to sublet your listing "
                  {match.listingTitle}" at {match.listingLoc}
                </p>
                <button onClick={() => handleApproveMatch(match)}>
                  Approve
                </button>
              </li>
            ) : null
          )}
        </ul>
      ) : (
        <p>No pending match requests</p>
      )}

      <h3>Approved</h3>
      {matches.filter((m) => m.owner === auth.currentUser.uid).length > 0 ? (
        <ul>
          {matches.map((match) =>
            match.owner === auth.currentUser.uid ? (
              <li key={match.key}>
                <p>
                  You have approved a matching with {match.requester} for
                  listing "{match.listingTitle}" at {match.listingLoc}
                </p>
                <button onClick={() => handleContactOwner(match, true)}>
                  Contact
                </button>
              </li>
            ) : null
          )}
        </ul>
      ) : (
        <p>No approved match requests</p>
      )}

      <h2>Your Match Request Status</h2>
      <h3>Pending</h3>
      {matchRequests.filter((m) => m.requester === auth.currentUser.uid).length >
      0 ? (
        <ul>
          {matchRequests.map((match) =>
            match.requester === auth.currentUser.uid ? (
              <li key={match.key}>
                <p>
                  Waiting on sublet owner's response for listing "
                  {match.listingTitle}" at {match.listingLoc}
                </p>
              </li>
            ) : null
          )}
        </ul>
      ) : (
        <p>No pending match requests</p>
      )}

      <h3>Approved</h3>
      {matches.filter((m) => m.requester === auth.currentUser.uid).length > 0 ? (
        <ul>
          {matches.map((match) =>
            match.requester === auth.currentUser.uid ? (
              <li key={match.key}>
                <p>
                  Owner of listing "{match.listingTitle}" at {match.listingLoc}{" "}
                  accepted your match
                </p>
                <button onClick={() => handleContactOwner(match, false)}>
                  Contact
                </button>
              </li>
            ) : null
          )}
        </ul>
      ) : (
        <p>No approved match requests</p>
      )}

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
