// Import the functions you need from the SDKs you need
import { getApps, initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { connectAuthEmulator } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBOVJkjTJzKTmj8wXupzL1z1yxhjn5c--4",
  authDomain: "service-backend-87abd.firebaseapp.com",
  databaseURL: "https://service-backend-87abd-default-rtdb.firebaseio.com",
  projectId: "service-backend-87abd",
  storageBucket: "service-backend-87abd.appspot.com",
  messagingSenderId: "585669766242",
  appId: "1:585669766242:web:be6fbb6de26047b34bb53b",
  measurementId: "G-8D8D37XKH2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
connectAuthEmulator(auth, "http://localhost:9099")


export { app, auth };