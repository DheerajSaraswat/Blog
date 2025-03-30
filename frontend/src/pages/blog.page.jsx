import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import Loader from "../components/loader.component";
import { Link } from "react-router-dom";
import BlogInteraction from "../components/blog-interaction.component";
import BlogPostCard from "../components/blog-post.component";
import { getFullDay } from "../common/date";
import BlogContent from "../components/blog-content.component";
import CommentsContainer, { fetchComments } from "../components/comments.component";

const blogDataStruc = {
  title: "",
  content: [],
  banner: "",
  des: "",
  author: { personal_info: {} },
  publishedAt: "",
};

export const BlogContext = createContext({});

function BlogPage() {
  const [blog, setBlog] = useState(blogDataStruc);
  const [loading, setLoading] = useState(true);
  const [similarBlogs, setSimilarBlogs] = useState(null);
  const [isLikedByUser, setIsLikedByUser] = useState(false);
  const [commentsWrapper, setCommentsWrapper] = useState(false);
  const [totalParentCommentsLoaded, setTotalParentCommentsLoaded] = useState(0);
  const { blog_id } = useParams();
  const {
    title,
    content,
    banner,
    des,
    author: {
      personal_info: { username: author_username, fullname, profile_img },
    },
    publishedAt,
  } = blog;
  const fetchBlogDetails = () => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blog", { blog_id })
      .then(async ({ data: { blog } }) => {
        // console.log(blog);
        blog.comments = await fetchComments({blog_id: blog._id, setParentCommentCountFun: setTotalParentCommentsLoaded})
        setBlog(blog);

        axios
          .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {
            tag: blog.tags[0],
            limit: 5,
            eliminate_blog: blog_id,
          })
          .then(({ data }) => {
            setSimilarBlogs(data.blogs);
          });

        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    resetStates();
    fetchBlogDetails();
  }, [blog_id]);

  const resetStates = () => {
    setBlog(blogDataStruc);
    setLoading(true);
    setSimilarBlogs(null);
    setIsLikedByUser(false)
    setCommentsWrapper(false);
    setTotalParentCommentsLoaded(0);
  };

  return (
    <AnimationWrapper>
      {loading ? (
        <Loader />
      ) : (
        <BlogContext.Provider value={{ blog, setBlog, isLikedByUser, setIsLikedByUser, commentsWrapper, setCommentsWrapper, totalParentCommentsLoaded, setTotalParentCommentsLoaded }}>

          <CommentsContainer />

          <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
            <img src={banner} className="aspect-video" />
            <div className="mt-12">
              <h2>{title}</h2>
              <div className="flex max-sm:flex-col justify-between my-8 ">
                <div className="flex gap-5 items-start">
                  <img src={profile_img} className="w-12 h-12 rounded-full" />
                  <p className="">
                    {fullname}
                    <br />@
                    <Link to={`/user/${author_username}`} className="underline">
                      {author_username}
                    </Link>
                  </p>
                </div>
                <p className="text-dark-grey opacity-75 max-sm:mt- max-sm:ml-12 max-sm:pl-5">
                  Published on {getFullDay(publishedAt)}
                </p>
              </div>
            </div>
            <BlogInteraction />
                <div className="my-12 font-gelasio block-page-content">
                    {
                        content[0].blocks.map((block, i)=>{
                            return <div className="my-4 md:my-8" key={i}>
                                <BlogContent block={block}/>
                            </div>
                        })
                    }
                </div>
            <BlogInteraction />

            {similarBlogs != null && similarBlogs.length ? (
              <>
                <h1 className="text-2xl mt-4 mb-10 font-medium">
                  Similar Blogs
                </h1>
                {similarBlogs.map((blog, i) => {
                  let {
                    author: { personal_info },
                  } = blog;
                  return (
                    <AnimationWrapper
                      key={i}
                      transition={{ duration: 1, delay: i * 0.08 }}
                    >
                      <BlogPostCard content={blog} author={personal_info} />
                    </AnimationWrapper>
                  );
                })}
              </>
            ) : (
              ""
            )}
          </div>
        </BlogContext.Provider>
      )}
    </AnimationWrapper>
  );
}
export default BlogPage;
