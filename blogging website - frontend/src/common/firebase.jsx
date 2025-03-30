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
    let user = null
    await signInWithPopup(auth, provider)
    .then( (res)=>{
        user = res.user
    } )
    .catch((err)=>{
        console.log(err)
    })
    return user
}