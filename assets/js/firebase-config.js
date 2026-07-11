// =====================================================================
// إعدادات Firebase — بيانات مشروع Al-hassan-arabic-platform
// =====================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc,
  deleteDoc, query, where, orderBy, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDL48EMz7fG-r-4cMuoDSBVqqKSLLg-lHA",
  authDomain: "al-hassan-arabic-platform.firebaseapp.com",
  projectId: "al-hassan-arabic-platform",
  storageBucket: "al-hassan-arabic-platform.firebasestorage.app",
  messagingSenderId: "433259710214",
  appId: "1:433259710214:web:0122644ca18a0affbc8087"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
  db, auth, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, setDoc,
  signInWithEmailAndPassword, onAuthStateChanged, signOut
};
