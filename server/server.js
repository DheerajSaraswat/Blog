import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import User from "./Schema/User.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccountKey from "./blog-website-mern-624c4-firebase-adminsdk-zce5s-dec75c6a9b.json" assert { type: "json" };
import { getAuth } from "firebase-admin/auth";
import { uploadOnCloudinary, deleteFromCloudinary, getPublicIdFromURL } from "./utils/cloudinary.js";
import { upload } from "./middleware/multer.js";
import axios from "axios";
import fs from "fs";
import Blog from "./Schema/Blog.js";
import Notification from "./Schema/Notification.js";
import Comment from "./Schema/Comment.js";
import path from 'path';
import helmet from 'helmet';

const server = express();
let PORT = 3000;
let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
});

server.use(express.json());
server.use(
  cors({
    origin: process.env.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
server.use(express.json({ limit: "10mb" }));

// Add security headers
server.use(helmet());

// Configure specific headers if needed
server.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:", "http:"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    fontSrc: ["'self'", "https:", "data:"],
  }
}));

mongoose.connect(process.env.DB_LOCATION, {
  autoIndex: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Access Token is Invalid" });
    }
    req.user = user.id;
    next();
  });
};

const formatDataToSend = (user) => {
  const access_token = jwt.sign(
    { id: user._id },
    process.env.SECRET_ACCESS_KEY
  );

  return {
    access_token,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
  };
};

const generateUsername = async (email) => {
  let username = email.split("@")[0];
  let isUsernameNotUnique = await User.exists({
    "personal_info.username": username,
  }).then((res) => res);
  if (isUsernameNotUnique) {
    username += nanoid().substring(0, 5);
  }
  return username;
};

server.post("/signup", (req, res) => {
  let { fullname, email, password } = req.body;
  if (fullname.length < 3) {
    return res
      .status(400)
      .json({ error: " Fullname must be greater than of length 3" });
  }
  if (!email.length) {
    return res.status(400).json({ error: "Email is required" });
  }
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }
  if (!password.length) {
    return res.status(400).json({ error: "Password is required" });
  }
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase",
    });
  }

  bcrypt.hash(password, 10, async (err, hashedPassword) => {
    const username = await generateUsername(email);
    const user = new User({
      personal_info: { fullname, email, password: hashedPassword, username },
    });

    user
      .save()
      .then((msg) => {
        return res.status(200).json(formatDataToSend(msg));
      })
      .catch((err) => {
        if (err.code == 11000) {
          return res.status(500).json({ error: "Email already exists" });
        }

        return res.status(500).json({ error: err.message });
      });
  });
});

server.post("/signin", async (req, res) => {
  let { email, password } = req.body;
  User.findOne({ "personal_info.email": email })
    .then((user) => {
      if (!user) {
        return res.status(403).json({ error: "Email not found" });
      }

      if (!user.google_auth) {
        bcrypt.compare(password, user.personal_info.password, (err, result) => {
          if (err) {
            return res
              .status(400)
              .json({ error: "Error occurred while login" });
          }
          if (result) {
            return res.status(200).json(formatDataToSend(user));
          } else {
            return res.status(403).json({ error: "Invalid password" });
          }
        });
      } else {
        return res
          .status(403)
          .json({ error: "Account was created with google. Log in google" });
      }
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post("/change-password", verifyJWT, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (
    !passwordRegex.test(currentPassword) ||
    !passwordRegex.test(newPassword)
  ) {
    return res.status(403).json({
      error:
        "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase",
    });
  }
  User.findOne({ _id: req.user }).then((user) => {
    if (user.google_auth) {
      return res.status(403).json({
        error: "Account was created with google. Password cannot be change.",
      });
    }
    bcrypt.compare(
      currentPassword,
      user.personal_info.password,
      (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Error occurred while changing password" });
        }
        if (result) {
          bcrypt.hash(newPassword, 10, (err, hash) => {
            if (err) {
              return res
                .status(400)
                .json({ error: "Error occurred while changing password" });
            }
            user.personal_info.password = hash;
            user
              .save()
              .then(() => {
                return res.json({ message: "Password changed successfully" });
              })
              .catch((err) => {
                console.log(err.message);
                return res.status(500).json({ error: err.message });
              });
          });
        } else {
          return res.status(403).json({ error: "Incorrect current password" });
        }
      }
    );
  });
});

server.post("/google-auth", async (req, res) => {
  const { access_token } = req.body;

  if (!access_token) {
    return res.status(400).json({ error: "Access token is required" });
  }

  try {
    const userInfo = await getAuth().verifyIdToken(access_token);
    const { email, name, picture } = userInfo;
    const image = picture.replace("s96-c", "s384-c");

    let user = await User.findOne({ "personal_info.email": email })
      .select(
        "personal_info.fullname personal_info.username personal_info.profile_img google_auth"
      )
      .exec();

    if (user) {
      if (!user.google_auth) {
        return res.status(403).json({
          error:
            "This email was signed up without Google. Please log in with a password.",
        });
      }
    } else {
      const username = await generateUsername(email);
      user = new User({
        personal_info: { fullname: name, email, username },
        google_auth: true,
      });
      await user.save();
    }

    return res.status(200).json(formatDataToSend(user));
  } catch (err) {
    console.error("Google Auth Error:", err);
    return res
      .status(500)
      .json({ error: "Failed to authenticate with Google. Please try again." });
  }
});

server.post("/upload-image", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const result = await uploadOnCloudinary(req.file.path);
    if (result) {
      return res.status(200).json({ url: result.url, public_id: result.public_id });
    } else {
      return res.status(500).json({ error: "Image upload failed" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

server.post("/upload-image-url", async (req, res) => {
  const { imageUrl } = req.body; // Expecting the image URL in the request body

  if (!imageUrl) {
    return res.status(400).json({ error: "No image URL provided" });
  }

  try {
    // Fetch the image from the URL
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });

    // Create a temporary file path
    const tempFilePath = path.join(
      __dirname,
      "temp",
      `image-${Date.now()}.jpg`
    );

    // Write the image data to a temporary file
    fs.writeFileSync(tempFilePath, response.data);

    // Upload the temporary file to Cloudinary
    const result = await uploadOnCloudinary(tempFilePath);

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);

    if (result) {
      return res.status(200).json({ url: result.url });
    } else {
      return res.status(500).json({ error: "Image upload failed" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

server.post("/latest-blogs", (req, res) => {
  const { page } = req.body;
  const maxLimit = 5;
  Blog.find({ draft: false })
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    )
    .sort({ publishedAt: -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post("/all-latest-blogs-count", (req, res) => {
  Blog.countDocuments({ draft: false })
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.get("/trending-blogs", (req, res) => {
  Blog.find({ draft: false })
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    )
    .sort({
      "activity.total_reads": -1,
      "activity.total_likes": -1,
      publishedAt: -1,
    })
    .select("blog_id title publishedAt -_id")
    .limit(5)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.post("/create-blog", verifyJWT, async (req, res) => {
  const authorId = req.user;
  let { title, banner, des, content, tags, draft, id } = req.body;
  if (!title.length) {
    return res.status(400).json({ error: "Title is required" });
  }
  if (!draft) {
    if (!des.length || des.length > 200) {
      return res
        .status(400)
        .json({ error: "Description should be between 1 and 200" });
    }
    if (!banner.length) {
      return res.status(400).json({ error: "Banner is required" });
    }
    if (!content.blocks.length) {
      return res.status(400).json({ error: "Content is required" });
    }
    if (!tags.length || tags.length > 10) {
      return res.status(400).json({ error: "Tags should be between 1 and 10" });
    }
  }

  tags = tags.map((tag) => tag.toLowerCase());
  const blogId =
    id ||
    title
      .replace(/[^a-zA-Z0-9]/g, " ")
      .replace(/\s+/g, "-")
      .trim()
      + nanoid();

  if (id) {
    Blog.findOneAndUpdate(
      { blogId },
      { title, des, banner, content, tags, draft: draft ? draft : false }
    )
      .then(() => {
        return res.status(200).json({ id: blogId });
      })
      .catch((err) => {
        return res.status(500).json({ error: err.message });
      });
  } else {
    let blog = new Blog({
      title,
      banner,
      des,
      content,
      tags,
      author: authorId,
      blog_id: blogId,
      draft: Boolean(draft),
    });
    const data = await blog.save();
    if (data) {
      const incrementVal = draft ? 0 : 1;
      User.findOneAndUpdate(
        { _id: authorId },
        {
          $inc: { "account_info.total_posts": incrementVal },
          $push: { blogs: blog._id },
        }
      )
        .then((user) => {
          return res.status(200).json({ id: blog.blog_id });
        })
        .catch((err) => {
          return res
            .status(500)
            .json({ error: "Failed to update total post number" });
        });
    }
  }

  // .then((blog) => {
  //   const incrementVal = draft ? 0 : 1;
  //   User.findOneAndUpdate(
  //     { _id: authorId },
  //     {
  //       $inc: { "account_info.total_posts": incrementVal },
  //       $push: { "blogs": blog._id },
  //     }
  //       .then((user) => {
  //         return res.status(200).json({ id: blog.blog_id });
  //       })
  //       .catch((err) => {
  //         return res
  //           .status(500)
  //           .json({ error: "Failed to update total post number" });
  //       })
  //   );
  // })
  // .catch((err) => {
  //   return res.status(500).json({ error: err.message });
  // });
});

server.post("/update-profile-image", verifyJWT, (req, res) => {
  const { image } = req.body;
  console.log(image);
  User.findOneAndUpdate(
    { _id: req.user },
    { "personal_info.profile_img": image }
  )
    .then(() => {
      return res
        .status(200)
        .json({ message: "Profile image updated successfully" });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

const bioLimit = 150;
server.post("/update-profile", verifyJWT, (req, res) => {
  const { username, bio, social_links } = req.body;
  if (username.length < 3) {
    return res
      .status(403)
      .json({ error: "Username must be at least 3 characters long" });
  }
  if (bio.length > bioLimit) {
    return res
      .status(403)
      .json({ error: `Bio must be less than ${bioLimit} characters` });
  }
  const socialLinksArr = Object.keys(social_links);
  try {
    for (let i = 0; i < socialLinksArr.length; i++) {
      if (social_links[socialLinksArr[i]].length) {
        const hostname = new URL(social_links[socialLinksArr[i]]).hostname;
        if (
          !hostname.includes(`${socialLinksArr[i]}.com`) &&
          socialLinksArr[i] != "website"
        ) {
          return res
            .status(403)
            .json({ error: `Invalid ${socialLinksArr[i]} link` });
        }
      }
    }
  } catch (error) {
    return res
      .status(500)
      .json({
        error: "You must provide full social links with http(s) included",
      });
  }
  const updateObj = {
    "personal_info.username": username,
    "personal_info.bio": bio,
    social_links,
  };
  User.findOneAndUpdate({ _id: req.user }, updateObj, { runValidators: true })
    .then(() => {
      return res.status(200).json({ username });
    })
    .catch((err) => {
      if (err.code == 11000) {
        return res.status(409).json({ error: "Username already exists" });
      }
      return res.status(500).json({ error: err.message });
    });
});

server.post("/search-users", (req, res) => {
  const { query } = req.body;
  User.find({ "personal_info.username": new RegExp(query, "i") })
    .limit(50)
    .select(
      "personal_info.fullname personal_info.username personal_info.profile_img -_id"
    )
    .then((user) => {
      return res.status(200).json({ user });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.post("/search-blogs", (req, res) => {
  const { tag, query, page, author, limit, eliminate_blog } = req.body;
  let findQuery;
  if (tag) {
    findQuery = { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };
  } else if (query) {
    findQuery = { draft: false, title: new RegExp(query, "i") };
  } else if (author) {
    findQuery = { author, draft: false };
  }
  const maxLimit = limit ? limit : 5;
  // console.log(maxLimit);
  Blog.find(findQuery)
    .populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    )
    .sort({ publishedAt: -1 })
    .select("blog_id title des banner activity tags publishedAt -_id")
    .skip((page - 1) * maxLimit)
    .limit(maxLimit)
    .then((blogs) => {
      return res.status(200).json({ blogs });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.post("/search-blogs-count", (req, res) => {
  const { tag, query, author } = req.body;
  let findQuery;
  if (tag) {
    findQuery = { tags: tag, draft: false };
  } else if (query) {
    findQuery = { draft: false, title: new RegExp(query, "i") };
  } else if (author) {
    findQuery = { author, draft: false };
  }
  Blog.countDocuments(findQuery)
    .then((count) => {
      return res.status(200).json({ totalDocs: count });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post("/get-profile", (req, res) => {
  const { username } = req.body;
  User.findOne({ "personal_info.username": username })
    .select("-personal_info.password -google_auth -updatedAt -blogs")
    .then((user) => {
      return res.status(200).json(user);
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({ error: err.message });
    });
});

server.post("/get-blog", (req, res) => {
  const { blog_id, mode, draft } = req.body;
  const incrementVal = mode != "edit" ? 1 : 0;

  Blog.findOneAndUpdate(
    { blog_id },
    { $inc: { "activity.total_reads": incrementVal } }
  )
    .populate(
      "author",
      "personal_info.fullname personal_info.username personal_info.profile_img"
    )
    .select("title des content banner activity publishedAt blog_id tags")
    .then((blog) => {
      User.findOneAndUpdate(
        { "personal_info.username": blog.author.personal_info.username },
        { $inc: { "account_info.total_reads": incrementVal } }
      ).catch((err) => {
        return res.status(500).json({ error: err.message });
      });
      if (blog.draft && !draft) {
        return res
          .status(500)
          .json({ error: "You can not access draft blogs" });
      }
      return res.status(200).json({ blog });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.post("/like-blog", verifyJWT, (req, res) => {
  const user_id = req.user;
  const { _id, isLikedByUser } = req.body;
  let incrementVal = !isLikedByUser ? 1 : -1;
  Blog.findOneAndUpdate(
    { _id },
    { $inc: { "activity.total_likes": incrementVal } }
  ).then((blog) => {
    if (!isLikedByUser) {
      let like = new Notification({
        type: "like",
        blog: _id,
        notification_for: blog.author,
        user: user_id,
      });
      like.save().then((notification) => {
        return res.status(200).json({ liked_by_user: true });
      });
    } else {
      Notification.findOneAndDelete({ user: user_id, blog: _id, type: "like" })
        .then((data) => {
          return res.status(200).json({ liked_by_user: false });
        })
        .catch((err) => {
          return res.status(500).json({ error: err.message });
        });
    }
  });
});

server.post("/isLiked-by-user", verifyJWT, (req, res) => {
  const user_id = req.user;
  const { _id } = req.body;
  Notification.exists({ user: user_id, type: "like", blog: _id })
    .then((result) => {
      return res.status(200).json({ result });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.post("/add-comment", verifyJWT, (req, res) => {
  const user_id = req.user;
  const { _id, comment, blog_author, replying_to, notification_id } = req.body;
  if (!comment.length) {
    return res
      .status(403)
      .json({ error: "Write something to leave a comment" });
  }
  let commentObj = {
    blog_id: _id,
    blog_author,
    comment,
    commented_by: user_id,
  };

  if (replying_to) {
    commentObj.parent = replying_to;
    commentObj.isReply = true;
  }

  new Comment(commentObj).save().then(async (commentFile) => {
    const { comment, commentedAt, children } = commentFile;
    Blog.findOneAndUpdate(
      { _id },
      {
        $push: { comments: commentFile._id },
        $inc: {
          "activity.total_comments": 1,
          "activity.total_parent_comments": replying_to ? 0 : 1,
        },
      }
    )
      .then((blog) => {
        console.log("New Comment Created");
      })
      .catch((err) => {
        console.log(err.message);
        return res
          .status(404)
          .json({ error: "Something went wrong while commenting" });
      });
    let notificationObj = {
      type: replying_to ? "reply" : "comment",
      blog: _id,
      notification_for: blog_author,
      user: user_id,
      comment: commentFile._id,
    };

    if (replying_to) {
      notificationObj.replied_on_comment = replying_to;
      await Comment.findOneAndUpdate(
        { _id: replying_to },
        { $push: { children: commentFile._id } }
      ).then((replyingToCommentDoc) => {
        notificationObj.notification_for = replyingToCommentDoc.commented_by;
      });
      if(notification_id){
        Notification.findOneAndUpdate({_id:notification_id}, {reply: commentFile._id}).then(notification => console.log("notification updated"))
      }
    }
    new Notification(notificationObj).save().then((notification) => {
      console.log("Notification Created");
    });
    return res.status(200).json({
      comment,
      commentedAt,
      _id: commentFile._id,
      user_id,
      children,
    });
  });
});

server.post("/get-blog-comments", (req, res) => {
  const { blog_id, skip } = req.body;
  const maxLimit = 5;
  Comment.find({ blog_id, isReply: false })
    .populate(
      "commented_by",
      "personal_info.username personal_info.fullname personal_info.profile_img"
    )
    .skip(skip)
    .limit(maxLimit)
    .sort({
      commentedAt: -1,
    })
    .then((comment) => {
      res.status(200).json(comment);
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post("/get-replies", (req, res) => {
  const { _id, skip } = req.body;
  const maxLimit = 5;
  Comment.findOne({ _id })
    .populate({
      path: "children",
      options: {
        limit: maxLimit,
        skip: skip,
        sort: { commentedAt: -1 },
      },
      populate: {
        path: "commented_by",
        select:
          "personal_info.username personal_info.fullname personal_info.profile_img",
      },
      select: "-blog_id -updatedAt",
    })
    .select("children")
    .then((doc) => {
      return res.status(200).json({ replies: doc.children });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

const deleteComments = (_id) => {
  Comment.findOneAndDelete({ _id })
    .then((comment) => {
      if (comment.parent) {
        Comment.findOneAndUpdate(
          { _id: comment.parent },
          { $pull: { children: _id } }
        )
          .then((data) => console.log("comment delete from parent"))
          .catch((err) => console.log(err));
      }
      Notification.findOneAndDelete({ comment: _id })
        .then((notification) => console.log("Comment Notification deleted"))
        .catch((err) => console.log(err));
      Notification.findOneAndUpdate({ reply: _id }, {$unset: {reply: 1}}).then((notification) =>
        console.log("reply notification deleted")
      );
      Blog.findOneAndUpdate(
        { _id: comment.blog_id },
        {
          $pull: { comments: _id },
          $inc: { "activity.total_comments": -1 },
          "activity.total_parent_comments": comment.parent ? 0 : -1,
        }
      ).then((blog) => {
        if (comment.children.length) {
          comment.children.map((replies) => {
            deleteComments(replies);
          });
        }
      });
    })
    .catch((err) => {
      console.log(err.message);
    });
};

server.post("/delete-comments", verifyJWT, (req, res) => {
  const user_id = req.user;
  const { _id } = req.body;
  Comment.findOne({ _id }).then((comment) => {
    if (user_id == comment.commented_by || user_id == comment.blog_author) {
      deleteComments(_id);
      return res.status(200).json({ message: "Comment deleted successfully" });
    } else {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this comment." });
    }
  });
});

server.get("/new-notification", verifyJWT, (req, res) => {
  const user_id = req.user;
  Notification.exists({
    notification_for: user_id,
    seen: false,
    user: { $ne: user_id },
  })
    .then((result) => {
      if (result) {
        return res.status(200).json({ new_notification_available: true });
      } else {
        return res.status(200).json({ new_notification_available: false });
      }
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post("/notifications", verifyJWT, (req, res) => {
  const user_id = req.user;
  const { page, filter, deletedDocCount } = req.body;
  const maxLimit = 10;
  const findQuery = { notification_for: user_id, user: { $ne: user_id } };
  const skipDocs = (page - 1) * maxLimit;
  if (filter != "all") {
    findQuery.type = filter;
  }
  if (deletedDocCount) {
    skipDocs -= deletedDocCount;
  }

  Notification.find(findQuery)
    .skip(skipDocs)
    .limit(maxLimit)
    .populate("blog", "title blog_id")
    .populate(
      "user",
      "personal_info.fullname personal_info.username personal_info.profile_img"
    )
    .populate("comment", "comment")
    .populate("replied_on_comment", "comment")
    .populate("reply", "comment")
    .sort({ createdAt: -1 })
    .select("createdAt type seen reply")
    .then((notifications) => {

      Notification.updateMany(findQuery, {seen: true}).skip(skipDocs).limit(maxLimit).then(()=>{
        console.log("Notification seen");
      })

      return res.status(200).json({ notifications });
    })
    .catch((err) => {
      console.log(err.message);
      return res.status(500).json({ error: err.message });
    });
});

server.post("/all-notifications-count", verifyJWT, (req, res) => {
  const user_id = req.user;
  const { filter } = req.body;
  const findQuery = { notification_for: user_id, user: { $ne: user_id } }
  if(filter!="all"){
    findQuery.type = filter;
  }
  Notification.countDocuments(findQuery).then(count=>{
    return res.status(200).json({totalDocs: count})
  }).catch(err=>{
    return res.status(500).json({error:err.message});
  })
});

server.post("/user-written-blogs", verifyJWT, (req, res)=>{
  const user_id = req.user
  const {page, draft, query, deletedDocCount} = req.body
  const maxLimit = 5;
  const skipDocs = (page-1)*maxLimit;
  if(deletedDocCount){
    skipDocs -= deletedDocCount;
  }
  Blog.find({author: user_id, draft, title: new RegExp(query, 'i')}).skip(skipDocs).limit(maxLimit).sort({publishedAt: -1}).select("title banner publishedAt blog_id activity des draft -_id").then(blogs=>{
    return res.status(200).json({blogs})
  }).catch(err=>{
    return res.status(500).json({error: err.message})
  })
})

server.post("/user-written-blogs-count", verifyJWT, (req, res)=>{
  const user_id = req.user
  const {draft, query} = req.body
  Blog.count({author: user_id, draft, title: new RegExp(query, 'i')}).then(count => {
    return res.status(200).json({totalDocs: count})
  }).catch(err=>{
    console.log(err.message);
    return res.status(500).json({error: err.message})
  })
})

server.post("/delete-blog", verifyJWT, async (req, res) => {
  const user_id = req.user;
  const { blog_id } = req.body;

  try {
    const blog = await Blog.findOne({ blog_id });
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Delete banner image from cloudinary if it exists
    if (blog.banner) {
      const publicId = getPublicIdFromURL(blog.banner);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    // Delete blog and related data
    await Promise.all([
      Blog.findOneAndDelete({ blog_id }),
      Notification.deleteMany({ blog: blog._id }),
      Comment.deleteMany({ blog_id: blog._id }),
      User.findOneAndUpdate(
        { _id: user_id },
        { $pull: { blog: blog._id }, $inc: { "account_info.total_posts": -1 } }
      )
    ]);

    return res.status(200).json({ status: "Done" });
  } catch (err) {
    console.error("Error deleting blog:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'public', 'temp');
if (!fs.existsSync(tempDir)){
    fs.mkdirSync(tempDir, { recursive: true });
}

// Add cleanup function for temp files
const cleanupTempFiles = async () => {
  const tempDir = path.join(__dirname, 'public', 'temp');
  
  try {
    const files = await fs.promises.readdir(tempDir);
    
    for (const file of files) {
      try {
        await fs.promises.unlink(path.join(tempDir, file));
        console.log(`Deleted temp file: ${file}`);
      } catch (err) {
        console.error(`Error deleting temp file ${file}:`, err);
      }
    }
  } catch (err) {
    console.error('Error reading temp directory:', err);
  }
};

// Add cleanup on server shutdown
process.on('SIGINT', () => {
  cleanupTempFiles();
  process.exit(0);
});

// Add periodic cleanup (every 24 hours)
setInterval(cleanupTempFiles, 24 * 60 * 60 * 1000);

server.post("/delete-image", verifyJWT, async (req, res) => {
  const { imageUrl } = req.body;
  
  if (!imageUrl) {
    return res.status(400).json({ error: "Image URL is required" });
  }

  try {
    const publicId = getPublicIdFromURL(imageUrl);
    if (!publicId) {
      return res.status(400).json({ error: "Invalid image URL" });
    }

    const result = await deleteFromCloudinary(publicId);
    if (result && result.result === 'ok') {
      return res.status(200).json({ message: "Image deleted successfully" });
    } else {
      return res.status(500).json({ error: "Failed to delete image" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
