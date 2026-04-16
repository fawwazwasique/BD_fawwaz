import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJPX-0A-vo61V8bEJZCppcLQ7eGwu1KPg",
  authDomain: "bdtracker-70ee6.firebaseapp.com",
  projectId: "bdtracker-70ee6",
  storageBucket: "bdtracker-70ee6.firebasestorage.app",
  messagingSenderId: "1022098641681",
  appId: "1:1022098641681:web:1361453cfd11533c7ff2b0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
