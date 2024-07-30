
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import 'firebase/compat/storage';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';

const firebaseConfig = {
    apiKey: "AIzaSyBvfFbph-fmdYIJZYLWhuGklV9pyIZRfrk",
    authDomain: "totemic-realm-422804-f0.firebaseapp.com",
    databaseURL: "https://totemic-realm-422804-f0-default-rtdb.firebaseio.com",
    projectId: "totemic-realm-422804-f0",
    storageBucket: "totemic-realm-422804-f0.appspot.com",
    messagingSenderId: "953328699299",
    appId: "1:953328699299:web:8e5a4c0a5e1433394bfc16",
    measurementId: "G-2D7EZCGW2Q"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
const storage = firebase.storage();
const database = firebase.database();



export { database, storage };

export default firebase;
