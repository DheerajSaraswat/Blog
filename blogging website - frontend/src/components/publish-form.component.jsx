import { Toaster, toast } from "react-hot-toast";
import AnimationWrapper from "../common/page-animation";
import { useContext } from "react";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";
import axios from "axios";
import { UserContext } from "../App";
import { useNavigate, useParams } from "react-router-dom";

function PublishForm() {
  let {
    blog,
    blog: { banner, title, tags, des, content },
    setEditorState,
    setBlog,
  } = useContext(EditorContext);

  let {blog_id} = useParams();

  let {
    userAuth: { access_token },
  } = useContext(UserContext);
  let nav = useNavigate();

  let handleCloseEvent = () => {
    setEditorState("editor");
  };

  let handleBlogTitleChange = (e) => {
    let input = e.target;
    setBlog({ ...blog, title: input.value });
  };

  let handleBlogDescriptionChange = (e) => {
    let input = e.target;
    setBlog({ ...blog, des: input.value });
  };

  let handleDesKeyDown = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();
    }
  };

  let handleKeyDown = (e) => {
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.preventDefault();
      let tag = e.target.value;
      if (tags.length < 10) {
        //10 is the tag limit
        if (!tags.includes(tag) && tag.length) {
          setBlog({ ...blog, tags: [...tags, tag] });
        }
      } else {
        toast.error("You can only add 10 tags");
      }
      e.target.value = "";
    }
  };

  let handlePublish = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }
    if (!title.length) {
      return toast.error("Please enter a title before publishing");
    }
    if (!des.length || des.length > 200) {
      return toast.error(
        "Please write a description within 200 characters limit before publishing"
      );
    }
    if (!tags.length) {
      return toast.error("Please add at least one tag before publishing");
    }
    let loadingToast = toast.loading("Publishing...");
    e.target.classList.add("disable");
    let blogData = {
      title,
      des,
      tags,
      banner,
      content,
      draft: false,
    };
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog",{...blogData, id:blog_id}, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      })
      .then(() => {
        toast.dismiss(loadingToast);
        e.target.classList.remove("disable");
        toast.success("Blog published successfully");

        setTimeout(() => {
          nav("/dashboard/blogs");
        }, 500);
      })
      .catch(({ response }) => {
        e.target.classList.remove("disable");
        toast.dismiss(loadingToast);
        return toast.error(response.data.error);
      });
  };
  return (
    <AnimationWrapper>
      <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
        <Toaster />
        <button
          className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
          onClick={handleCloseEvent}
        >
          <i className="fi fi-br-cross"></i>
        </button>
        <div className="max=w-[550px] center ">
          <p className="text-dark-grey mb-1"></p>
          <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
            <img src={banner} />
          </div>

          <h1 className="text-4xl font-medium mt-2 leading-tight line-clamp-2">
            {title}
          </h1>

          <p className="font-gelasio line-clamp-2 text-xl leading-7 mt-4">
            {des}
          </p>
        </div>
        <div className="border-grey lg:border-1 lg:pl-8">
          <p className="text-dark-grey mb-2 mt-9">Blog Title</p>
          <input
            type="text"
            placeholder="Blog Title"
            defaultValue={title}
            className="input-box pl-4"
            onChange={handleBlogTitleChange}
          />

          <p className="text-dark-grey mb-2 mt-9">
            Short description about your blog
          </p>

          <textarea
            maxLength={200}
            defaultValue={des}
            className="h-40 resize-none leading-7 input-box pl-4"
            onChange={handleBlogDescriptionChange}
            onKeyDown={handleDesKeyDown}
          ></textarea>
          <p className="mt-1 text-dark-grey text-sm text-right">
            {200 - des.length} characters left
          </p>
          <p className="text-dark-grey mb-2 mt-9">
            Topics - (Helps in searching and ranking your blog post)
          </p>
          <div className="relative input-box pl-2 py-2 pb-4">
            <input
              type="text"
              placeholder="Topic"
              className="sticky input-box bg-white top-0 left-0 pl-4 mb-3 focus:bg-white"
              onKeyDown={handleKeyDown}
            />
            {tags.map((tag, i) => {
              return <Tag tag={tag} tagIndex={i} key={i} />;
            })}
          </div>
          <p className="mt-1 mb-4 text-dark-grey text-right">
            {10 - tags.length} Tags left
          </p>
          <button className="btn-dark px-8 " onClick={handlePublish}>
            Publish
          </button>
        </div>
      </section>
    </AnimationWrapper>
  );
}
export default PublishForm;
