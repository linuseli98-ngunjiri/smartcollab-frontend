import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import axios from "axios";
import Login from "./Login";
import Dashboard from "./Dashboard";
import StudentPortal from "./StudentPortal";

const API = "https://smartcollab-backend-781602191566.us-central1.run.app";

function App() {
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Save user to DB and get role
        await axios.post(`${API}/save-user`, {
          uid:   currentUser.uid,
          name:  currentUser.displayName,
          email: currentUser.email,
          role:  "student"
        });
        // Fetch role from DB
        const roleRes = await axios.post(`${API}/get-role`, {
            email: currentUser.email
        });
        setRole(roleRes.data.role);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!user)   return <Login onLogin={setUser} />;

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h2 style={styles.logo}>SmartCollab</h2>
        <div style={styles.userInfo}>
          <img src={user.photoURL} alt="profile" style={styles.avatar} />
          <span style={styles.userName}>{user.displayName}</span>
          <span style={styles.roleBadge}>{role}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      {role === "lecturer"
        ? <Dashboard user={user} />
        : <StudentPortal user={user} />
      }
    </div>
  );
}

const styles = {
  loading:   { display: "flex", justifyContent: "center",
               alignItems: "center", height: "100vh", fontSize: "18px" },
  container: { minHeight: "100vh", backgroundColor: "#f0f2f5" },
  navbar:    { backgroundColor: "#1a1a2e", padding: "12px 24px",
               display: "flex", justifyContent: "space-between",
               alignItems: "center" },
  logo:      { color: "white", margin: 0, fontSize: "20px" },
  userInfo:  { display: "flex", alignItems: "center", gap: "12px" },
  avatar:    { width: "36px", height: "36px", borderRadius: "50%" },
  userName:  { color: "white", fontSize: "14px" },
  roleBadge: { backgroundColor: "#4285F4", color: "white",
               fontSize: "11px", padding: "2px 8px",
               borderRadius: "12px" },
  logoutBtn: { backgroundColor: "transparent", color: "white",
               border: "1px solid white", padding: "6px 12px",
               borderRadius: "4px", cursor: "pointer",
               fontSize: "13px" },
};

export default App;