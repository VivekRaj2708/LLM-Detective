// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCc0jcPNBWOYqkPX9ef5uwWY28FrvHtW2E",
  authDomain: "nlp-iitgngpt.firebaseapp.com",
  projectId: "nlp-iitgngpt",
  storageBucket: "nlp-iitgngpt.firebasestorage.app",
  messagingSenderId: "1088179192039",
  appId: "1:1088179192039:web:95b4bf32247175f36a6242"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };