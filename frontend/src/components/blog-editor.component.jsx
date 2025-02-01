import { Link, useNavigate, useParams } from "react-router-dom";
import darkLogo from "../imgs/logo-dark.png";
import lightLogo from "../imgs/logo-light.png";
import AnimationWrapper from "../common/page-animation";
import lightBanner from "../imgs/blog banner light.png"
import darkBanner from "../imgs/blog banner dark.png";
import axios from "axios";
import { useContext, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import { ThemeContext, UserContext } from "../App";

function BlogEditor() {
  const {
    blog,
    blog: { title, banner, content, tags, author, des },
    setBlog,
    textEditor,
    setTextEditor,
    editorState,
    setEditorState,
  } = useContext(EditorContext);

  const {blog_id} = useParams()
  const {theme} = useContext(ThemeContext)

  const {
    userAuth: { access_token },
  } = useContext(UserContext);

  const nav = useNavigate();

  useEffect(() => {
    if (!textEditor.isReady) {
      setTextEditor(
        new EditorJS({
          holderId: "textEditor",
          data: Array.isArray(content) ? content[0] : content,
          tools: tools,
          placeholder: "Let's write here....",
        })
      );
    }
  }, []);

  const handleBannerUpload = async (e) => {
    const image = e.target.files[0];

    if (!image) return;
    const loadingToast = toast.loading("Uploading...");
    const formData = new FormData();
    formData.append("image", image); // Append the file to FormData

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_DOMAIN}/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data", // Set the content type
          },
        }
      );
      const imageUrl = response.data.url; // Get the URL from the response
      console.log(imageUrl); // You can now store this URL in your database
      if (imageUrl) {
        toast.dismiss(loadingToast);
        toast.success("Uploaded 👍");
        setBlog({ ...blog, banner: imageUrl });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      return toast.error(error);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  //Makes TextArea Dynamic
  const handleTitleChange = (e) => {
    const title = e.target;
    title.style.height = "auto";
    title.style.height = title.scrollHeight + "px";

    setBlog({ ...blog, title: title.value });
  };

  const handlePublish = () => {
    if (!banner.length) {
      return toast.error("Upload a blog banner to publish it");
    }
    if (!title.length) {
      return toast.error("Enter a blog title to publish it");
    }
    if (textEditor.isReady) {
      textEditor
        .save()
        .then((data) => {
          if (data.blocks.length) {
            setBlog({ ...blog, content: data });
            setEditorState("publish");
          } else {
            return toast.error("Please enter some content to publish it");
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };

  const handleError = (e) => {
    let img = e.target
    img.src = theme == "light" ? lightBanner : darkBanner
  }

  const handleSaveDraft = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }
    if (!title.length) {
      return toast.error("Enter a blog title to save it as draft");
    }
    const loadingToast = toast.loading("Saving Draft...");
    e.target.classList.add("disable");
    if (textEditor.isReady) {
      textEditor.save().then((content) => {
        const data = {
          title,
          banner,
          des,
          content,
          tags,
          draft: true,
        };
        axios
          .post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", {...data, id:blog_id}, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${access_token}`,
            },
          })
          .then(() => {
            toast.dismiss(loadingToast);
            e.target.classList.remove("disable");
            toast.success("Draft Saved");
            setTimeout(() => {
              nav("/dashboard/blogs?tab=draft");
            }, 500);
          })
          .catch(({ response }) => {
            toast.dismiss(loadingToast);
            e.target.classList.remove("disable");
            return toast.error(response.data.error);
          });
      });
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={theme == "light" ? darkLogo : lightLogo} />
        </Link>
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length ? title : "New Blog"}
        </p>

        <div className="flex gap-4 ml-auto">
          <button onClick={handlePublish} className="btn-dark py-2">
            Publish
          </button>
          <button className="btn-light py-2" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>
      </nav>
      <Toaster />
      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div className="relatice aspect-video bg-white border-4 border-grey hover:opacity-80%">
              <label htmlFor="uploadBanner">
                <img
                  src={banner}
                  className="z-20 cursor-pointer"
                  onError={handleError}
                />
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            <textarea
              defaultValue={title}
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 bg-white"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>

            <hr className="w-full opacity-10 my-5" />

            <div id="textEditor" className="font-gelasio"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
}
export default BlogEditor;
