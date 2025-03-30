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
  let {
    blog,
    blog: { title, banner, content, tags, author, des },
    setBlog,
    textEditor,
    setTextEditor,
    editorState,
    setEditorState,
  } = useContext(EditorContext);

  let {blog_id} = useParams()
  let {theme} = useContext(ThemeContext)

  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  let nav = useNavigate();

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

  let handleBannerUpload = (e) => {
    let img = e.target.files[0];

    if (img) {
      let loadingToast = toast.loading("Uploading...");
      
      const formData = new FormData();
      formData.append("image", img);

      // Log the file details
      console.log("Uploading file:", {
        name: img.name,
        type: img.type,
        size: img.size
      });

      axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/upload-image",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${access_token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log('Upload progress:', percentCompleted + '%');
          }
        }
      )
      .then((res) => {
        toast.dismiss(loadingToast);
        toast.success("Uploaded 👍");
        console.log("Upload response:", res.data);
        setBlog({ ...blog, banner: res.data.url });
      })
      .catch((error) => {
        toast.dismiss(loadingToast);
        console.error("Upload error:", error.response?.data || error.message);
        toast.error(error.response?.data?.error || "Upload failed");
      });
    }
  };

  let handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  //Makes TextArea Dynamic
  let handleTitleChange = (e) => {
    let title = e.target;
    title.style.height = "auto";
    title.style.height = title.scrollHeight + "px";

    setBlog({ ...blog, title: title.value });
  };

  let handlePublish = () => {
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
        .then(()=>{
          if(draft){
            axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/save-draft",{blog}).then(()=>{
               toast.success("Draft saved successfully");
            }).catch(err=>{
               toast.error("Failed to save draft");
            })
          }
        })

        .catch((err) => {
          console.log(err);
        });
    }
  };

  let handleError = (e) => {
    let img = e.target
    img.src = theme == "light" ? lightBanner : darkBanner
  }

  let handleSaveDraft = (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }
    if (!title.length) {
      return toast.error("Enter a blog title to save it as draft");
    }

    let loadingToast = toast.loading("Saving Draft...");
    e.target.classList.add("disable");

    if (textEditor.isReady) {
      textEditor.save().then((content) => {
        // Create blog data object
        let blogData = {
          title,
          banner,
          des,
          content,
          tags,
          draft: true,
        };

        // If blog_id exists, add it to the data
        if (blog_id) {
          blogData.id = blog_id;
        }

        // Make API request
        axios
          .post(
            import.meta.env.VITE_SERVER_DOMAIN + "/create-blog",
            blogData,
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            }
          )
          .then(() => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);
            toast.success("Draft Saved");

            // Navigate to drafts page after a short delay
            setTimeout(() => {
              nav("/dashboard/blogs?tab=draft");
            }, 500);
          })
          .catch(({ response }) => {
            e.target.classList.remove("disable");
            toast.dismiss(loadingToast);
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
