import InputBox from "../components/input.component"
import AnimationWrapper from "../common/page-animation"
import { useContext, useRef, useState } from "react";
import {Toaster, toast} from "react-hot-toast"
import axios from "axios"
import {UserContext} from "../App"

function ChangePassword() {

    const changePasswordForm = useRef();
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

    const {userAuth:{access_token}} = useContext(UserContext)

    const handleSubmit = (e)=>{
        e.preventDefault()
        const form = new FormData(changePasswordForm.current);
        let formData = {};
        for(let[key, value] of form.entries()){
            formData[key] = value;
        }
        const {currentPassword, newPassword} = formData
        if(!currentPassword.length || !newPassword.length){
            return toast.error("Fill all the inputs")
        }
        if(!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)){
            return toast.error(
              "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase"
            );
        }
        e.target.setAttribute.style = "disabled";

        const loadingToast = toast.loading("Updating...")
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/change-password", formData,{
            headers:{
                Authorization: `Bearer ${access_token}`
            }
        }).then(()=>{
            toast.dismiss(loadingToast)
            changePasswordForm.current.reset() 
            e.target.removeAttribute("disabled");
            return toast.success("Password updated successfully")
        }).catch(({response})=>{
            toast.dismiss(loadingToast)
            e.target.removeAttribute("disabled")
            return toast.error(response.data.error)
        })
    }

  return (
    <AnimationWrapper>
        <Toaster />
      <form ref={changePasswordForm}>
        <h1 className="max-md:hidden ">Change Password</h1>
        <div className="py-10 w-full md:max-w-[400px]">
          <InputBox
            name="currentPassword"
            type="password"
            className="profile-edit-input "
            placeholder="Current Password"
            iconName="fi-rr-unlock"
          />
          <InputBox
            name="newPassword"
            type="password"
            className="profile-edit-input "
            placeholder="New Password"
            iconName="fi-rr-unlock"
          />
          <button onClick={handleSubmit} className="btn-dark px-10" type="submit">Change Password</button>
        </div>
      </form>
    </AnimationWrapper>
  );
}
export default ChangePassword