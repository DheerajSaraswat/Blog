import { useContext, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import { Link, Navigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";
import { authWithGoogle } from "../common/firebase";

const UserAuthForm = ({ type }) => {
  let {
    userAuth: { access_token },
    setUserAuth,
  } = useContext(UserContext);

  const [loading, setLoading] = useState(false);

  let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
  let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

  const serverRoute = type==="sign-up" ? "/signup" : "/signin"

  const handleSubmit = (e) => {
    e.preventDefault();
    let form = new FormData(formElement);
    let formData = {};
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

    setLoading(true);
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData)
      .then(({ data }) => {
        storeInSession("user", JSON.stringify(data));
        setUserAuth(data);
      })
      .catch(({ response }) => {
        toast.error(response.data.error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleGoogleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const userData = await authWithGoogle();
        
        // Make request to your backend
        const response = await axios.post(
            import.meta.env.VITE_SERVER_DOMAIN + "/google-auth", 
            {
                access_token: userData.accessToken
            }
        );

        if (response.data) {
            storeInSession("user", JSON.stringify(response.data));
            setUserAuth(response.data);
            toast.success("Successfully logged in with Google!");
        }
    } catch (error) {
        console.error("Google Auth Error:", error);
        
        // Show appropriate error message
        if (error.code === 'auth/popup-closed-by-user') {
            toast.error("Login cancelled by user");
        } else if (error.code === 'auth/popup-blocked') {
            toast.error("Popup was blocked by the browser");
        } else {
            toast.error("Failed to login with Google. Please try again.");
        }
    } finally {
        setLoading(false);
    }
  };

  return access_token ? (
    <Navigate to="/" />
  ) : (
    <AnimationWrapper keyValue={type}>
      <section className="h-cover flex items-center justify-center">
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
            disabled={loading}
          >
            {loading ? (
              <span className="loading-circle"></span>
            ) : type == "sign-in" ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </button>
          <div className="relative w-full flex items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
            <hr className="w-1/2 border-black" />
            <p>or</p>
            <hr className="w-1/2 border-black" />
          </div>
          <button
            className="btn-dark flex items-center justify-center gap-4 w-[90%] center"
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <img src={googleIcon} className="w-5" />
            {loading ? (
              <span className="loading-circle"></span>
            ) : (
              "Continue with Google"
            )}
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
};

export default UserAuthForm;
