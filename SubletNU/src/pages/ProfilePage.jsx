import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  ref,
  remove,
  push,
  update,
  onValue,
  get,
  onChildAdded,
  onChildRemoved,
} from "firebase/database";
import CreateListingModal from "../components/CreateListingModel";
import PageWrapper from "../components/PageWrapper";
import "../css/profile.css";

export default function ProfilePage() {
  const [matchRequests, setRequests] = useState([]);
  const [matchRequestsIds, setRequestIds] = useState([]);
  const [matches, setMatches] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const dbMatchReqRef = ref(db, "users/" + auth.currentUser.uid + "/userMatchRequests");
  const dbMatchesRef = ref(db, "users/" + auth.currentUser.uid + "/userMatches");

  useEffect(() => {
    return onChildAdded(dbMatchReqRef, (snapshot) => {
      const data = snapshot.val();
      if (!matchRequestsIds.includes(data)) {
        setRequestIds((prev) => [...prev, data]);
        const dbRef = ref(db, "matches/" + data);
        onValue(dbRef, (snap) => {
          if (snap.val()) setRequests((prev) => [...prev, snap.val()]);
        });
      }
    });
  }, [dbMatchReqRef]);

  useEffect(() => {
    return onChildRemoved(dbMatchReqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRequestIds((prev) => prev.filter((item) => item !== data.key));
        setRequests((prev) => prev.filter((item) => item.key !== data.key));
      }
    });
  }, [dbMatchReqRef]);

  useEffect(() => {
    return onChildAdded(dbMatchesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      const dbRef = ref(db, "matches/" + data);
      onValue(dbRef, (snap) => {
        if (snap.val()) {
          const alreadyIn = matches.find((m) => m.key === data);
          if (!alreadyIn) setMatches((prev) => [...prev, snap.val()]);
        }
      });
    });
  }, [dbMatchesRef]);

  const handleApproveMatch = async (matchObj) => {
    update(ref(db, "matches/" + matchObj.key), { approved: "true" });

    const ownerPath = "users/" + matchObj.owner + "/userMatchRequests";
    const requesterPath = "users/" + matchObj.requester + "/userMatchRequests";

    const [snapOwner, snapRequester] = await Promise.all([
      get(ref(db, ownerPath)),
      get(ref(db, requesterPath)),
    ]);

    const removeKey = (obj, key) => {
      if (!obj) return {};
      const index = Object.values(obj).indexOf(key);
      return index !== -1 ? { [index]: null } : {};
    };

    await update(ref(db), {
      [ownerPath]: removeKey(snapOwner.val(), matchObj.key),
      [requesterPath]: removeKey(snapRequester.val(), matchObj.key),
    });

    await updateMatch(matchObj);
    setMatches((prev) => [...prev, matchObj]);
    setRequestIds((prev) => prev.filter((item) => item !== matchObj.key));
    setRequests((prev) => prev.filter((item) => item.key !== matchObj.key));
    alert("Match Approved. Email sent.");
  };

  const updateMatch = async (matchObj) => {
    await update(ref(db), {
      ["users/" + matchObj.owner + "/userMatches"]: push(ref(db)).key,
      ["users/" + matchObj.requester + "/userMatches"]: push(ref(db)).key,
    });
  };

  const handleContactOwner = (match, isOwner) => {
    alert(
      isOwner
        ? "Here is your sublet requester's email: " + match.requesterContact
        : "Here is the sublet owner's email: " + match.ownerContact
    );
  };

  return (
    <PageWrapper
      onShowAll={() => {}}
      onShowUser={() => {}}
      onCreateNew={() => setIsCreateOpen(true)}
    >
      <h2 className="profile-title">Your Profile</h2>
      <p className="profile-email">Email: {auth.currentUser.email}</p>

      <h3>Open Match Requests</h3>
      {matchRequests.length > 0 ? (
        <ul>
          {matchRequests.map((match) => (
            <li key={match.key}>
              {match.owner !== auth.currentUser.uid ? (
                <p>Waiting on owner's response for listing {match.listingId}</p>
              ) : (
                <>
                  <p>User {match.requester} wants to sublet your listing {match.listingId}</p>
                  <button onClick={() => handleApproveMatch(match)}>Approve</button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No match requests</p>
      )}

      <h3>Responses/Matches</h3>
      {matches.length > 0 ? (
        <ul>
          {matches.map((match) => (
            <li key={match.key}>
              {match.owner === auth.currentUser.uid ? (
                <>
                  <p>You matched with {match.requester} for listing {match.listingId}</p>
                  <button onClick={() => handleContactOwner(match, true)}>Contact</button>
                </>
              ) : (
                <>
                  <p>Owner of listing {match.listingId} accepted your match</p>
                  <button onClick={() => handleContactOwner(match, false)}>Contact</button>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p>No matches</p>
      )}

      <CreateListingModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </PageWrapper>
  );
}
