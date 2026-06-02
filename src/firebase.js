import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCAtt-W4R9D8z_BFn5ayxsvHBVgLaUpME4",
  authDomain: "groupwork-collab.firebaseapp.com",
  projectId: "groupwork-collab",
  storageBucket: "groupwork-collab.firebasestorage.app",
  messagingSenderId: "781602191566",
  appId: "1:781602191566:web:4a6c01871edcb5ab3df89f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };