import { useEffect, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation, {
  activeTabRef,
} from "../components/inpage-navigation.component";
import axios from "axios";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import NoDataMessage from "../components/nodata.component";
import { filterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";

function Homepage() {
  const categories = [
    "programming",
    "hollywood",
    "nature",
    "peace",
    "study",
    "cooking",
    "tech",
    "mountains",
    "lakes",
    "social media",
    "travel",
  ];

  const [blogs, setBlogs] = useState(null);
  const [trendingBlogs, setTrendingBlogs] = useState();
  const [pageState, setPageState] = useState("home");

  const loadBlogByCategory = (e) => {
    const category = e.target.innerText.toLowerCase();
    setBlogs(null);
    if (pageState == category) {
      //if we click again on that tag then we will deselect it
      setPageState("home");
      return;
    }
    setPageState(category);
    axios.get(`http://localhost:3001/api/blog/${category}`);
  };

  const fetchLatestBlogs = ({page=1}) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs", {page})
      .then(async ({ data }) => {
        // console.log(data.blogs);
        const formateData = await filterPaginationData({
          state: blogs,
          data: data.blogs,
          page,
          countRoute:"/all-latest-blogs-count"
        })
// console.log(formateData);
        setBlogs(formateData)

      })
      .catch((err) => {
        console.log(err);
      });
  };
  const fetchBlogsByCategory = ({page=1}) => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", {
        tag: pageState, page
      })
      .then(async ({ data }) => {
        const formateData = await filterPaginationData({
          state: blogs,
          data: data.blogs,
          page,
          countRoute:"/search-blogs-count",
          data_to_send: {tag: pageState}
        })
        setBlogs(formateData);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const fetchTrendingBlogs = () => {
    axios
      .get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs")
      .then(({ data }) => {
        setTrendingBlogs(data.blogs);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  useEffect(() => {
    activeTabRef.current.click(); //virtually clicking on button to change hr length accordingly
    if (pageState == "home") fetchLatestBlogs({page: 1});
    else {
      fetchBlogsByCategory({page:1}); 
    }
    if (!trendingBlogs) fetchTrendingBlogs();
  }, [pageState]);

  return (
    <AnimationWrapper>
      <section className="h-cover flex justify-center gap-10">
        {/* div for latest blogs */}
        <div className="w-full">
          <InPageNavigation
            routes={[pageState, "trending blogs"]}
            defaultHidden={["trending blogs"]}
          >
            <>
              {blogs == null ? (
                <Loader />
              ) : (
                !blogs.results.length ? <NoDataMessage message={"Oopsie!, nothing is here"}/> 
                : blogs.results.map((blog, index) => {
                  return (
                    <AnimationWrapper
                      transition={{ duration: 1, delay: index * 0.1 }}
                      key={index}
                    >
                      <BlogPostCard
                        content={blog}
                        author={blog.author.personal_info}
                      />
                    </AnimationWrapper>
                  );
                })
              )}
              <LoadMoreDataBtn state={blogs} fetchDataFun={(pageState=="home"?fetchLatestBlogs:fetchBlogsByCategory)} />
            </>
            {trendingBlogs == null ? (
              <Loader />
            ) : (
              !trendingBlogs.length ? <NoDataMessage message={"Oopsie, nothing is here"}/>
              :trendingBlogs.map((blog, index) => {
                return (
                  <AnimationWrapper
                    transition={{ duration: 1, delay: index * 0.1 }}
                    key={index}
                  >
                    <MinimalBlogPost blog={blog} index={index} />
                  </AnimationWrapper>
                );
              })
            )}
          </InPageNavigation>
        </div>
        {/* div for filters and trending blogs */}
        <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-1 border-grey pl-8 pt-3 max-md:hidden">
          <div className="flex flex-col gap-10">
            <h1 className="font-medium text-xl mb-8">
              Stories from all Interests
            </h1>
            <div>
              <div className="flex gap-3 flex-wrap">
                {categories.map((category, i) => {
                  return (
                    <button
                      className={
                        "tag " +
                        (pageState == category ? "bg-black text-white" : "")
                      }
                      key={i}
                      onClick={loadBlogByCategory}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h1 className="font-medium text-xl mb-8">
                Trending <i className="fi fi-rr-arrow-trend-up"></i>
              </h1>
              {trendingBlogs == null ? (
                <Loader />
              ) : (
                !trendingBlogs.length ? <NoDataMessage message={"Oopsie, nothing is here."} />
                :trendingBlogs.map((blog, index) => {
                  return (
                    <AnimationWrapper
                      transition={{ duration: 1, delay: index * 0.1 }}
                      key={index}
                    >
                      <MinimalBlogPost blog={blog} index={index} />
                    </AnimationWrapper>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </AnimationWrapper>
  );
}
export default Homepage;
