import React from "react";
import { auth, googleProvider } from "./firebase";
import { signInWithPopup } from "firebase/auth";

function Login({ onLogin }) {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      onLogin(user);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>SmartCollab</h1>
        <p style={styles.subtitle}>AI-Powered Group Collaboration System</p>
        <button style={styles.button} onClick={handleLogin}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f2f5"
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    textAlign: "center",
    width: "360px"
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#1a1a2e",
    marginBottom: "8px"
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "32px"
  },
  button: {
    backgroundColor: "#4285F4",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "6px",
    fontSize: "16px",
    cursor: "pointer",
    width: "100%"
  }
};

export default Login;