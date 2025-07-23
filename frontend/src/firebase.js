// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// We don't need analytics for this project, but it's here if you want it later.
// import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDowgj0evQGUOnkWNdq9-xdvzCF7zlKA3Q",
  authDomain: "base-platform-app.firebaseapp.com",
  projectId: "base-platform-app",
  storageBucket: "base-platform-app.appspot.com",
  messagingSenderId: "656654634203",
  appId: "1:656654634203:web:4e53c548d3986a5ab710fe",
  measurementId: "G-DRQHENFL0Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase Authentication
export const auth = getAuth(app);

// const analytics = getAnalytics(app); // You can uncomment this line if you need analytics
