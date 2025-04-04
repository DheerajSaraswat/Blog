import { initializeApp } from "firebase/app";
import {GoogleAuthProvider, getAuth, signInWithPopup} from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDGNJl_dWuTf62ZTcIBi1wy2obgsYZsjlE",
  authDomain: "blog-website-mern-624c4.firebaseapp.com",
  projectId: "blog-website-mern-624c4",
  storageBucket: "blog-website-mern-624c4.appspot.com",
  messagingSenderId: "832874942801",
  appId: "1:832874942801:web:ea4408655c8fe91cda0370",
};

const app = initializeApp(firebaseConfig);

const provider = new GoogleAuthProvider()

const auth = getAuth()

export const authWithGoogle = async() => {
    try {
        console.log("Starting Google auth...");
        const result = await signInWithPopup(auth, provider);
        // console.log("Auth result:", result);
        
        const user = result.user;
        // console.log("User data:", {
        //     email: user.email,
        //     name: user.displayName,
        //     photo: user.photoURL
        // });
        
        const token = await user.getIdToken();
        // console.log("Got ID token:", token.substring(0, 10) + "...");
        
        return {
            accessToken: token,
            email: user.email,
            name: user.displayName,
            profileImage: user.photoURL
        };
    } catch (err) {
        // console.error("Detailed auth error:", {
        //     code: err.code,
        //     message: err.message,
        //     fullError: err
        // });
        throw err;
    }
}