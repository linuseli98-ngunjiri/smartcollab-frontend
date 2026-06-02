import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Login from "./Login";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  if (!user) return <Login onLogin={setUser} />;

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h2 style={styles.logo}>SmartCollab</h2>
        <div style={styles.userInfo}>
          <img
            src={user.photoURL}
            alt="profile"
            style={styles.avatar}
          />
          <span style={styles.userName}>{user.displayName}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
      <div style={styles.content}>
        <h1>Welcome, {user.displayName}</h1>
        <p>Email: {user.email}</p>
        <p>Dashboard coming next...</p>
      </div>
    </div>
  );
}

const styles = {
  loading: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    fontSize: "18px"
  },
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5"
  },
  navbar: {
    backgroundColor: "#1a1a2e",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  logo: {
    color: "white",
    margin: 0,
    fontSize: "20px"
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%"
  },
  userName: {
    color: "white",
    fontSize: "14px"
  },
  logoutBtn: {
    backgroundColor: "transparent",
    color: "white",
    border: "1px solid white",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px"
  },
  content: {
    padding: "40px"
  }
};

export default App;
