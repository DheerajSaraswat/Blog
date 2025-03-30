import { useContext } from "react";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import ggogleIcon from "../imgs/google.png";
import { Link, Navigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import {storeInSession} from "../common/session.jsx"
import { UserContext } from "../App.jsx";
import { authWithGoogle } from "../common/firebase.jsx";

function UserAuthForm({ type }) {

  let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
  let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

  const {userAuth: {access_token}, setUserAuth} = useContext(UserContext)
  console.log(access_token);

  const serverRoute = type==="sign-up" ? "/signup" : "/signin"

  const userAuthThroughServer = (serverRoute, formData) => {
    
    axios.post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData)
    .then(({data})=>{
      storeInSession("user", JSON.stringify(data))
      // console.log(sessionStorage);
      setUserAuth(data)
    })
    .catch(({response})=>{
      toast.error(response.data.error)
    })

  }

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = new FormData(formElement);
    const formData = {};
    for (let [key, value] of form.entries()) {
      formData[key] = value;
    }
    let { fullname, email, password } = formData;

    if (fullname) {
      if (fullname.length < 3) {
        return toast.error("Fullname must be greater than length 3",
        );
      }
    }
    if (!email.length) {
      return toast.error("Email is required" );
    }
    if (!emailRegex.test(email)) {
      return toast.error("Invalid email" );
    }
    if (!passwordRegex.test(password)) {
      return toast.error(
          "Password must be 6-20 characters long, contain atleast 1 numeric and 1 special character",
      );
    }

    userAuthThroughServer( serverRoute, formData)

  };

  const handleGoogleAuth = (e)=>{
    e.preventDefault();
    authWithGoogle().then(user => {
      // console.log(user);
      const server = "/google-auth";
      const formData = {
        access_token: user.accessToken
      }

      userAuthThroughServer(server, formData)

    })
    .catch(err=>{
      toast.error("Trouble login through google")
      return console.log(err)
    })
  }

  return (
    access_token?
    <Navigate to="/" />
    :
    <AnimationWrapper keyValue={type}>
      <section className=" h-cover flex items-center justify-center">
        <Toaster />
        <form id="formElement" className="w-[80%] max-w-[400px]">
          <h1 className="text-4xl font-gelasio capitalize text-center mb-24">
            {type == "sign-in" ? "Welcome Back" : "Join us today"}
          </h1>
          {type != "sign-in" ? (
            <InputBox
              name="fullname"
              type="text"
              placeholder="Full Name"
              iconName="fi-rr-user"
            />
          ) : (
            ""
          )}
          <InputBox
            name="email"
            type="email"
            placeholder="Email"
            iconName="fi-rr-envelope"
          />
          <InputBox
            name="password"
            type="password"
            placeholder="Password"
            iconName="fi-rr-lock"
          />
          <button
            className="btn-dark center mt-14"
            type="submit"
            onClick={handleSubmit}
          >
            {type.replace("-", " ")}
          </button>
          <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
            <hr className="w-1/2 border-black" />
            <p>or</p>
            <hr className="w-1/2 border-black" />
          </div>
          <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center" onClick={handleGoogleAuth}>
            <img src={ggogleIcon} alt="Google Icon" className="w-5" />
            Continue With Google
          </button>
          {type == "sign-in" ? (
            <p className="text-center text-xl text-dark-grey mt-6">
              Don't have an account?
              <Link to="/signup" className="underline text-black text-xl ml-1">
                Sign Up
              </Link>
            </p>
          ) : (
            <p className="text-center text-xl text-dark-grey mt-6">
              Already have an account?
              <Link to="/signin" className="underline text-black text-xl ml-1">
                Sign In
              </Link>
            </p>
          )}
        </form>
      </section>
    </AnimationWrapper>
  );
}
export default UserAuthForm;
