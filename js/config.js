// file: js/config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBnRdsqG4JtukT6temrz1K47tegzJqCO40",
    authDomain: "donkinh-eea6b.firebaseapp.com",
    databaseURL: "https://donkinh-eea6b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "donkinh-eea6b",
    storageBucket: "donkinh-eea6b.firebasestorage.app",
    messagingSenderId: "863876314073",
    appId: "1:863876314073:web:56e2c946a245c8b84c1fc8"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);