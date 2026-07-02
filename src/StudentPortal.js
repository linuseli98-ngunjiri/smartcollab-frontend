import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

function StarRating({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => onChange(star)}
          style={{
            fontSize: "24px",
            cursor: "pointer",
            color: star <= value ? "#f5a623" : "#ddd"
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function StudentPortal({ user }) {
  const [groups, setGroups]     = useState([]);
  const [selected, setSelected] = useState(null);
  const [members, setMembers]   = useState([]);
  const [myScore, setMyScore]   = useState(null);
  const [ratings, setRatings]   = useState({});
  const [message, setMessage]   = useState("");

  useEffect(() => {
    fetchMyGroups();
  }, []);

  const fetchMyGroups = async () => {
    try {
      const email = user.email;
      const res   = await axios.get(`${API}/my-group/${email}`);
      setGroups(res.data);
      if (res.data.length > 0) {
        selectGroup(res.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  };

  const selectGroup = async (group) => {
  setSelected(group);
  const [membersRes, scoreRes] = await Promise.all([
    axios.get(`${API}/group-members/${group.id}`),
    axios.get(`${API}/my-score/${group.id}/${user.email}`)
  ]);
  setMembers(membersRes.data);
  setMyScore(scoreRes.data);

  // Log activity once per session
  if (!sessionStorage.getItem(`logged_${group.id}`)) {
    axios.post(`${API}/log-activity`, {
      group_id: group.id,
      user_email: user.email,
      action: "dashboard_view"
    });
    sessionStorage.setItem(`logged_${group.id}`, "true");
  }
};

  const submitRating = async (ratedEmail) => {
    const score = ratings[ratedEmail];
    if (!score) {
      setMessage("Please select a star rating first.");
      return;
    }
    try {
      await axios.post(`${API}/peer-rating`, {
        group_id:    selected.id,
        rater_email: user.email,
        rated_email: ratedEmail,
        score:       score
      });
      setMessage(`✅ Rating submitted for ${ratedEmail}`);
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Failed to submit rating.");
    }
  };

  if (groups.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.empty}>
            You are not assigned to any group yet. Contact your lecturer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* Group selector */}
      {groups.length > 1 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>My Groups</h2>
          {groups.map(g => (
            <button key={g.id}
              style={{
                ...styles.groupBtn,
                backgroundColor: selected?.id === g.id ? "#1a1a2e" : "#f0f2f5",
                color: selected?.id === g.id ? "white" : "#1a1a2e"
              }}
              onClick={() => selectGroup(g)}>
              {g.group_name} — {g.unit}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <>
          {/* Group info */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>{selected.group_name}</h2>
            <p style={styles.unit}>{selected.unit}</p>
            <div style={styles.links}>
              <a href={selected.board_url} target="_blank"
                rel="noreferrer" style={styles.link}>
                Open Trello Board
              </a>
              <a href={selected.drive_folder_url} target="_blank"
                rel="noreferrer" style={styles.link}>
                Open Drive Folder
              </a>
            </div>
          </div>

          {/* My contribution score */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>My Contribution Score</h2>
            {myScore && Object.keys(myScore).length > 0 ? (
              <>
                <div style={styles.totalScore}>
                  {(
                    (myScore.tasks_score || 0) +
                    (myScore.files_score || 0) +
                    (myScore.comments_score || 0) +
                    (myScore.activity_score || 0) +
                    (myScore.peer_score || 0)
                  ).toFixed(0)} pts
                </div>
                <div style={styles.breakdown}>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>Tasks</span>
                    <span style={styles.breakdownValue}>
                      {myScore.tasks_score || 0}
                    </span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>Files</span>
                    <span style={styles.breakdownValue}>
                      {myScore.files_score || 0}
                    </span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>Comments</span>
                    <span style={styles.breakdownValue}>
                      {myScore.comments_score || 0}
                    </span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>Activity</span>
                    <span style={styles.breakdownValue}>
                      {myScore.activity_score || 0}
                    </span>
                  </div>
                  <div style={styles.breakdownItem}>
                    <span style={styles.breakdownLabel}>Peer</span>
                    <span style={styles.breakdownValue}>
                      {myScore.peer_score || 0}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p style={styles.empty}>
                No activity recorded yet. Start working on your Trello board.
              </p>
            )}
          </div>

          {/* Peer rating */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Rate Your Group Members</h2>
            {message && <p style={styles.message}>{message}</p>}
            {members
              .filter(m => m.user_email !== user.email)
              .map(m => (
                <div key={m.user_email} style={styles.memberRow}>
                  <span style={styles.memberEmail}>{m.user_email}</span>
                  <StarRating
                    value={ratings[m.user_email] || 0}
                    onChange={val => setRatings({
                      ...ratings, [m.user_email]: val
                    })}
                  />
                  <button
                    style={styles.rateBtn}
                    onClick={() => submitRating(m.user_email)}>
                    Submit
                  </button>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container:      { padding: "24px", maxWidth: "800px", margin: "0 auto" },
  card:           { backgroundColor: "white", borderRadius: "12px",
                    padding: "24px", marginBottom: "24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  cardTitle:      { fontSize: "18px", fontWeight: "600",
                    marginBottom: "16px", color: "#1a1a2e" },
  unit:           { color: "#666", fontSize: "14px", marginBottom: "12px" },
  links:          { display: "flex", gap: "16px" },
  link:           { fontSize: "14px", color: "#4285F4",
                    textDecoration: "none" },
  totalScore:     { fontSize: "48px", fontWeight: "700",
                    color: "#1a1a2e", marginBottom: "16px" },
  breakdown:      { display: "flex", gap: "12px", flexWrap: "wrap" },
  breakdownItem:  { backgroundColor: "#f0f2f5", borderRadius: "8px",
                    padding: "12px 16px", textAlign: "center",
                    minWidth: "80px" },
  breakdownLabel: { display: "block", fontSize: "11px",
                    color: "#666", marginBottom: "4px" },
  breakdownValue: { display: "block", fontSize: "20px",
                    fontWeight: "600", color: "#1a1a2e" },
  memberRow:      { display: "flex", alignItems: "center",
                    gap: "16px", marginBottom: "16px",
                    padding: "12px", backgroundColor: "#f9f9f9",
                    borderRadius: "8px", flexWrap: "wrap" },
  memberEmail:    { fontSize: "14px", color: "#333",
                    flex: 1, minWidth: "150px" },
  rateBtn:        { backgroundColor: "#1a1a2e", color: "white",
                    border: "none", padding: "6px 14px",
                    borderRadius: "4px", cursor: "pointer",
                    fontSize: "13px" },
  groupBtn:       { display: "block", width: "100%",
                    padding: "10px 16px", marginBottom: "8px",
                    border: "none", borderRadius: "6px",
                    cursor: "pointer", fontSize: "14px",
                    textAlign: "left" },
  message:        { fontSize: "13px", color: "#444",
                    marginBottom: "12px" },
  empty:          { color: "#999", fontSize: "14px" },
};

export default StudentPortal;