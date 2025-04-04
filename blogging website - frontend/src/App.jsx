import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar.component";
import UserAuthForm from "./pages/userAuthForm.page";
import { createContext, useState, useEffect } from "react";
import { lookInSession } from "./common/session";
import Editor from "./pages/editor.pages";
import Homepage from "./pages/home.page";
import SearchPage from "./pages/search.page";
import PageNotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
import SideNav from "./components/sidenavbar.component";
import ChangePassword from "./pages/change-password.page";
import EditProfile from "./pages/edit-profile.page";
import Notification from "./pages/notifications.page";
import ManageBlogs from "./pages/manage-blogs.page";

export const UserContext = createContext({});

export const ThemeContext = createContext({});

const darkThemePreference = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const App = () => {
  const [userAuth, setUserAuth] = useState("");

  const [theme, setTheme] = useState(()=> darkThemePreference() ? "dark" : "light")

  const favicon = document.getElementById("favicon")
  theme == "dark" ? favicon.href="/src/imgs/logo-light.png" : favicon.href = "/src/imgs/logo-dark.png"

  useEffect(() => {
    const userInSession = lookInSession("user");
    const themeInSession = lookInSession("theme")
    userInSession ? setUserAuth(JSON.parse(userInSession)) : setUserAuth({ access_token: null })
    themeInSession ? setTheme(()=>{
      document.body.setAttribute("data-theme", themeInSession)
      return themeInSession
    }) : document.body.setAttribute("data-theme", theme)

  }, []);

  console.log('Environment:', {
    serverDomain: import.meta.env.VITE_SERVER_DOMAIN,
    nodeEnv: import.meta.env.NODE_ENV
  });

  return (
    <ThemeContext.Provider value={{theme, setTheme}}>
      <UserContext.Provider value={{ userAuth, setUserAuth }}>
        <Routes>
          <Route path="editor" element={<Editor />} />
          <Route path="editor/:blog_id" element={<Editor />} />
          <Route path="/" element={<Navbar />}>
            <Route index element={<Homepage />} />
            <Route path="dashboard" element={<SideNav />}>
              <Route path="blogs" element={<ManageBlogs />} />
              <Route path="notifications" element={<Notification />} />
            </Route>
            <Route path="settings" element={<SideNav />}>
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="change-password" element={<ChangePassword />} />
            </Route>
            <Route path="signin" element={<UserAuthForm type="sign-in" />} />
            <Route path="signup" element={<UserAuthForm type="sign-up" />} />
            <Route path="search/:query" element={<SearchPage />} />
            <Route path="user/:id" element={<ProfilePage />} />
            <Route path="blog/:blog_id" element={<BlogPage />} />
            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </UserContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
