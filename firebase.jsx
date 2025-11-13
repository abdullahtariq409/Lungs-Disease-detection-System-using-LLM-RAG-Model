// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBxl87jwECPp7wXrg9-vHwRmotjbpPWyX4",
  authDomain: "xray-8a239.firebaseapp.com",
  databaseURL: "https://xray-8a239-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xray-8a239",
  storageBucket: "xray-8a239.appspot.com",
  messagingSenderId: "981898794168",
  appId: "1:981898794168:web:3b9127cd2c330d5ff5104d",
  measurementId: "G-EM7LQX90YR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
