import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:5000";

function ScoreBar({ value, max = 100 }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={styles.barBg}>
      <div style={{ ...styles.barFill, width: `${pct}%` }} />
    </div>
  );
}

function GroupCard({ group }) {
  const [scores, setScores]       = useState([]);
  const [members, setMembers]     = useState([]);
  const [expanded, setExpanded]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const [groupName, setGroupName] = useState(group.group_name);
  const [unit, setUnit]           = useState(group.unit);
  const [newEmail, setNewEmail]   = useState("");
  const [editMsg, setEditMsg]     = useState("");

  const loadScores = async () => {
    if (!expanded) {
      const [scoresRes, membersRes] = await Promise.all([
        axios.get(`${API}/scores/${group.id}`),
        axios.get(`${API}/group-members/${group.id}`)
      ]);
      setScores(scoresRes.data);
      setMembers(membersRes.data);
    }
    setExpanded(!expanded);
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API}/update-group/${group.id}`, {
        group_name: groupName,
        unit:       unit
      });
      setEditMsg("✅ Group updated successfully.");
      setEditing(false);
    } catch (err) {
      setEditMsg("❌ Failed to update group.");
    }
  };

  const handleAddMember = async () => {
    if (!newEmail) return;
    try {
      await axios.post(`${API}/add-member`, {
        group_id:   group.id,
        user_email: newEmail
      });
      setMembers([...members, { user_email: newEmail, role: "member" }]);
      setNewEmail("");
      setEditMsg(`✅ ${newEmail} added.`);
    } catch (err) {
      setEditMsg(err.response?.data?.message || "❌ Failed to add member.");
    }
  };

  const handleRemoveMember = async (email) => {
    try {
      await axios.delete(`${API}/remove-member`, {
        data: { group_id: group.id, user_email: email }
      });
      setMembers(members.filter(m => m.user_email !== email));
      setEditMsg(`✅ ${email} removed.`);
    } catch (err) {
      setEditMsg("❌ Failed to remove member.");
    }
  };

  return (
    <div style={styles.groupCard}>
      {/* Group header */}
      <div style={styles.groupHeader}>
        <div>
          <span style={styles.groupName}>{group.group_name}</span>
          <span style={styles.groupUnit}>{group.unit}</span>
        </div>
        <div style={styles.groupLinks}>
          <a href={group.board_url} target="_blank"
            rel="noreferrer" style={styles.link}>Trello</a>
          <a href={group.drive_folder_url} target="_blank"
            rel="noreferrer" style={styles.link}>Drive</a>
          <button style={styles.scoresBtn} onClick={loadScores}>
            {expanded ? "Hide" : "View Scores"}
          </button>
          <button style={styles.editBtn} onClick={async () => {
            if (!editing) {
              const res = await axios.get(`${API}/group-members/${group.id}`);
              setMembers(res.data);
            }
            setEditing(!editing);
            setEditMsg("");
          }}>
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div style={styles.editPanel}>
          <h4 style={styles.scoresTitle}>Edit Group</h4>
          {editMsg && <p style={styles.editMsg}>{editMsg}</p>}

          <input style={styles.editInput} value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Group name" />
          <input style={styles.editInput} value={unit}
            onChange={e => setUnit(e.target.value)}
            placeholder="Unit" />
          <button style={styles.saveBtn} onClick={handleUpdate}>
            Save Changes
          </button>

          <div style={styles.memberSection}>
            <h5 style={styles.memberTitle}>Members</h5>
            {members.map(m => (
              <div key={m.user_email} style={styles.memberEditRow}>
                <span style={styles.memberEmail}>{m.user_email}</span>
                <span style={styles.memberRole}>{m.role}</span>
                <button style={styles.removeBtn}
                  onClick={() => handleRemoveMember(m.user_email)}>
                  Remove
                </button>
              </div>
            ))}
            <div style={styles.addMemberRow}>
              <input style={styles.addMemberInput} value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="Add member email" />
              <button style={styles.addBtn} onClick={handleAddMember}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scores panel */}
      {expanded && (
        <div style={styles.scoresSection}>
          <h4 style={styles.scoresTitle}>AI Contribution Scores</h4>
          {scores.length === 0 ? (
            <p style={styles.noScores}>No activity logged yet.</p>
          ) : (
            scores.map((s, i) => (
              <div key={i} style={styles.scoreRow}>
                <div style={styles.scoreHeader}>
                  <span style={styles.scoreName}>{s.user_email}</span>
                  <span style={styles.scoreTotal}>
                    {(s.tasks_score + s.files_score +
                      s.comments_score + s.activity_score +
                      s.peer_score).toFixed(0)} pts
                  </span>
                </div>
                <ScoreBar
                  value={s.tasks_score + s.files_score +
                         s.comments_score + s.activity_score +
                         s.peer_score}
                  max={100}
                />
                <div style={styles.scoreBreakdown}>
                  <span>Tasks: {s.tasks_score}</span>
                  <span>Files: {s.files_score}</span>
                  <span>Comments: {s.comments_score}</span>
                  <span>Activity: {s.activity_score}</span>
                  <span>Peer: {s.peer_score}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Dashboard({ user }) {
  const [groups, setGroups]       = useState([]);
  const [groupName, setGroupName] = useState("");
  const [unit, setUnit]           = useState("");
  const [members, setMembers]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [message, setMessage]     = useState("");

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API}/groups`);
      setGroups(res.data);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName || !unit) {
      setMessage("Please fill in group name and unit.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const memberList = members.split(",").map(m => m.trim()).filter(Boolean);
      const res = await axios.post(`${API}/create-group`, {
        group_name: groupName,
        unit:       unit,
        members:    memberList
      });
      setMessage(`✅ Group created! Trello: ${res.data.board_url}`);
      setGroupName("");
      setUnit("");
      setMembers("");
      fetchGroups();
    } catch (err) {
      setMessage("❌ Failed to create group. Check backend.");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Create New Group</h2>
        <input style={styles.input} placeholder="Group name"
          value={groupName} onChange={e => setGroupName(e.target.value)} />
        <input style={styles.input} placeholder="Unit (e.g. DSE 315)"
          value={unit} onChange={e => setUnit(e.target.value)} />
        <input style={styles.input}
          placeholder="Member emails (comma separated)"
          value={members} onChange={e => setMembers(e.target.value)} />
        <button style={styles.button} onClick={handleCreateGroup}
          disabled={loading}>
          {loading ? "Creating..." : "Create Group"}
        </button>
        {message && <p style={styles.message}>{message}</p>}
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>All Groups ({groups.length})</h2>
        {groups.length === 0 ? (
          <p style={styles.empty}>No groups yet.</p>
        ) : (
          groups.map(group => (
            <GroupCard key={group.id} group={group} />
          ))
        )}
      </div>
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
  input:          { width: "100%", padding: "10px 12px", marginBottom: "12px",
                    border: "1px solid #ddd", borderRadius: "6px",
                    fontSize: "14px", boxSizing: "border-box" },
  button:         { backgroundColor: "#1a1a2e", color: "white",
                    border: "none", padding: "12px 24px",
                    borderRadius: "6px", fontSize: "14px",
                    cursor: "pointer", width: "100%" },
  message:        { marginTop: "12px", fontSize: "13px", color: "#444" },
  empty:          { color: "#999", fontSize: "14px" },
  groupCard:      { border: "1px solid #eee", borderRadius: "8px",
                    padding: "16px", marginBottom: "12px" },
  groupHeader:    { display: "flex", justifyContent: "space-between",
                    alignItems: "center", flexWrap: "wrap", gap: "8px" },
  groupName:      { fontWeight: "600", fontSize: "15px",
                    color: "#1a1a2e", marginRight: "8px" },
  groupUnit:      { fontSize: "12px", color: "#666",
                    backgroundColor: "#f0f2f5", padding: "2px 8px",
                    borderRadius: "12px" },
  groupLinks:     { display: "flex", gap: "8px", alignItems: "center" },
  link:           { fontSize: "13px", color: "#4285F4",
                    textDecoration: "none" },
  scoresBtn:      { fontSize: "12px", backgroundColor: "#1a1a2e",
                    color: "white", border: "none", padding: "4px 10px",
                    borderRadius: "4px", cursor: "pointer" },
  scoresSection:  { marginTop: "16px", borderTop: "1px solid #eee",
                    paddingTop: "16px" },
  scoresTitle:    { fontSize: "14px", fontWeight: "600",
                    color: "#1a1a2e", marginBottom: "12px" },
  noScores:       { color: "#999", fontSize: "13px" },
  scoreRow:       { marginBottom: "16px" },
  scoreHeader:    { display: "flex", justifyContent: "space-between",
                    marginBottom: "4px" },
  scoreName:      { fontSize: "13px", fontWeight: "500", color: "#333" },
  scoreTotal:     { fontSize: "13px", fontWeight: "600", color: "#1a1a2e" },
  barBg:          { backgroundColor: "#f0f2f5", borderRadius: "4px",
                    height: "8px", marginBottom: "4px" },
  barFill:        { backgroundColor: "#1a1a2e", borderRadius: "4px",
                    height: "8px", transition: "width 0.3s ease" },
  scoreBreakdown: { display: "flex", gap: "12px", flexWrap: "wrap",
                    fontSize: "11px", color: "#888" },
  editBtn:       { fontSize: "12px", backgroundColor: "#4285F4",
                 color: "white", border: "none", padding: "4px 10px",
                 borderRadius: "4px", cursor: "pointer" },
editPanel:     { marginTop: "16px", borderTop: "1px solid #eee",
                 paddingTop: "16px" },
editInput:     { width: "100%", padding: "8px 12px", marginBottom: "8px",
                 border: "1px solid #ddd", borderRadius: "6px",
                 fontSize: "14px", boxSizing: "border-box" },
saveBtn:       { backgroundColor: "#1a1a2e", color: "white",
                 border: "none", padding: "8px 16px",
                 borderRadius: "4px", cursor: "pointer",
                 fontSize: "13px", marginBottom: "16px" },
memberSection: { marginTop: "16px" },
memberTitle:   { fontSize: "13px", fontWeight: "600",
                 marginBottom: "8px", color: "#1a1a2e" },
memberEditRow: { display: "flex", alignItems: "center",
                 gap: "8px", marginBottom: "8px",
                 padding: "8px", backgroundColor: "#f9f9f9",
                 borderRadius: "6px" },
memberRole:    { fontSize: "11px", color: "#666",
                 backgroundColor: "#eee", padding: "2px 6px",
                 borderRadius: "10px" },
removeBtn:     { fontSize: "12px", backgroundColor: "#dc3545",
                 color: "white", border: "none", padding: "3px 8px",
                 borderRadius: "4px", cursor: "pointer",
                 marginLeft: "auto" },
addMemberRow:  { display: "flex", gap: "8px", marginTop: "8px" },
addMemberInput:{ flex: 1, padding: "8px 12px",
                 border: "1px solid #ddd", borderRadius: "6px",
                 fontSize: "13px" },
addBtn:        { backgroundColor: "#1a1a2e", color: "white",
                 border: "none", padding: "8px 16px",
                 borderRadius: "4px", cursor: "pointer",
                 fontSize: "13px" },
editMsg:       { fontSize: "13px", color: "#444", marginBottom: "12px" },                  
};

export default Dashboard;