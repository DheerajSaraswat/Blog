import { useEffect, useContext, useState, useRef } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { profileDataStructure } from "./profile.page";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { Toaster, toast } from "react-hot-toast";
import InputBox from "../components/input.component";
import { storeInSession } from "../common/session";

function EditProfile() {
  const bioLimit = 150;

  const [profile, setProfile] = useState(profileDataStructure);
  const {
    userAuth,
    userAuth: { access_token },setUserAuth
  } = useContext(UserContext);
  const [charactersLeft, setCharactersLeft] = useState(bioLimit);
  const [loading, setLoading] = useState(true);
  const {
    personal_info: {
      username: profile_username,
      fullname,
      profile_img,
      email,
      bio,
    },
    social_links,
  } = profile;
  const profileImageRef = useRef();
  const [updatedProfileImage, setUpdatedProfileImage] = useState(null);

  useEffect(() => {
    if (access_token) {
      axios
        .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-profile", {
          username: userAuth.username,
        })
        .then(({ data }) => {
          setProfile(data);
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [access_token]);
  const editProfileForm = useRef();

  const handleCharacterChange = (e) => {
    setCharactersLeft(bioLimit - e.target.value.length);
  };

  const handleImagePreview = async (e) => {
    const img = e.target.files[0];
    profileImageRef.current.src = URL.createObjectURL(img);
    const formData = new FormData();
    formData.append("image", img);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const imageUrl = response.data.url; 
      setUpdatedProfileImage(imageUrl); 
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleUpload =  (e) => {
    e.preventDefault();

    if (updatedProfileImage) {
      const loadingToast = toast.loading("Uploading...");
      axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/update-profile-image", {
        image: updatedProfileImage,
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
      }).then(({data}) => {
        const newUserAuth = {...userAuth, profile_img:data.profile_img}
        storeInSession("user",JSON.stringify(newUserAuth))
        setUserAuth(newUserAuth)
        setUpdatedProfileImage(null)
        toast.dismiss(loadingToast);
        toast.success("Profile image updated");
        e.target.removeAttribute("disabled")
      }).catch(err => {
        console.log(err);
        e.target.removeAttribute("disabled");
        toast.dismiss(loadingToast);
        toast.error("Failed to update profile image");
      });
    }
  };

  const handleSubmit = (e)=>{
    e.preventDefault();
    const form = new FormData(editProfileForm.current);
    let formData = {}
    for(let [key, value] of form.entries()){
        formData[key] = value
    }
    const {username, bio, youtube, facebook, twitter, github, instagram, website} = formData;
    if(username.length<3){
        return toast.error("Username must be at least 3 characters long");
    }
    if(bio.length > bioLimit){
        return toast.error(`Bio must be less than ${bioLimit} characters`);
    }
    let loadingToast = toast.loading("Updating...")
    e.target.setAttribute = "disabled"
    axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/update-profile", {
        username,
        bio,
        social_links:{youtube, facebook, twitter, github, instagram, website}
    },{
        headers:{
            "Authorization": `Bearer ${access_token}`,
        }
    }).then(({data})=>{
        if(userAuth.username != data.username){
            const newUserAuth = {...userAuth, username: data.username}
            storeInSession("user", JSON.stringify(newUserAuth))
            setUserAuth(newUserAuth)
        }
        toast.dismiss(loadingToast)
        toast.success("Profile updated");
        e.target.removeAttribute("disabled")
    }).catch(({response})=>{
        toast.dismiss(loadingToast);
        toast.error(response.data.error);
        e.target.removeAttribute("disabled");
    })
  }

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <form ref={editProfileForm}>
          <Toaster />
          <h1 className="max-md:hidden">Edit Profile</h1>
          <div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">
            <div className="max-lg:center mb-5">
              <label
                htmlFor="uploadImage"
                className="relative block w-48 h-48 g-grey rounded-full overflow-hidden"
              >
                <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white bg-black/80 opacity-0 hover:opacity-100 cursor-pointer">
                  Upload Image
                </div>
                <img src={profile_img} ref={profileImageRef} />
              </label>
              <input
                type="file"
                id="uploadImage"
                accept=".jpeg, .png"
                hidden
                onChange={handleImagePreview}
              />
              <button
                className="btn-light mt-5 max-lg:center lg:w-full px-10"
                onClick={handleUpload}
              >
                Upload
              </button>
            </div>
            <div className="w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
                <div>
                  <InputBox
                    name="fullname"
                    type="text"
                    value={fullname}
                    placeholder="Full Name"
                    disable={true}
                    iconName="fi-rr-user"
                  />
                </div>
                <div>
                  <InputBox
                    name="email"
                    type="email"
                    value={email}
                    placeholder="Email"
                    disable={true}
                    iconName="fi-rr-envelope"
                  />
                </div>
              </div>
              <InputBox
                type="text"
                name="username"
                value={profile_username}
                placeholder="Username"
                iconName="fi-rr-at"
              />
              <p className="text-dark-grey -mt-3">
                Username will use to search user and will be visible to others
              </p>
              <textarea
                name="bio"
                maxLength={bioLimit}
                defaultValue={bio}
                className="input-box h-64 lg:h-40 resize-none leading-7 mt-5 pl-5"
                placeholder="Bio"
                onChange={handleCharacterChange}
              ></textarea>
              <p className="mt-1 text-dark-grey">
                {charactersLeft} characters left
              </p>
              <p className="my-6 text-dark-grey">
                Add your social handles below
              </p>
              <div className="md:grid md:grid-cols-2 gap-x-6">
                {Object.keys(social_links).map((key, i) => {
                  let link = social_links[key];

                  return (
                    <InputBox
                      key={i}
                      name={key}
                      type="text"
                      value={link}
                      placeholder="https://"
                      iconName={
                        "fi " +
                        (key !== "website" ? "fi-brands-" + key : "fi-rr-globe")
                      }
                    />
                  );
                })}
              </div>
              <button className="btn-dark w-auto px-10" type="submit" onClick={handleSubmit}>
                Update
              </button>
            </div>
          </div>
        </form>
      )}
    </AnimationWrapper>
  );
}
export default EditProfile;
