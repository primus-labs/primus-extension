import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// Replace these values with your actual Firebase config from the Firebase console
const firebaseConfig = {
    apiKey: "AIzaSyA8fn0p3PGLJNspTGBLhsIIQdRpWItxStI",
    authDomain: "primus-extension.firebaseapp.com",
    projectId: "primus-extension",
    storageBucket: "primus-extension.firebasestorage.app",
    messagingSenderId: "222398452957",
    appId: "1:222398452957:web:dd788ba78cf863d2a6b734"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 