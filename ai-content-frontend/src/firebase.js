// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBfnYv8A1bPIBy346zBX4mkog1m4YPuIg4",
  authDomain: "ai-content-prototype.firebaseapp.com",
  projectId: "ai-content-prototype",
  storageBucket: "ai-content-prototype.firebasestorage.app",
  messagingSenderId: "173613280791",
  appId: "1:173613280791:web:40385b07a5d00ed1fbf652",
  measurementId: "G-RSE8Q89K3K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };