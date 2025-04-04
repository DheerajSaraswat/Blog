import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Code from "@editorjs/code";
import Image from "@editorjs/image";
import Header from "@editorjs/header"
import Marker from "@editorjs/marker"
import Quote from "@editorjs/quote"
import InlineCode from "@editorjs/inline-code"

let uploadImageByUrl = async (url) => {
  let response = await fetch("http://localhost:3000/upload-image-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl: url }), // Send the image URL in the request body
  });

  if (response.ok) {
    let data = await response.json();
    return {
      success: 1,
      file: {
        url: data.url, // URL of the uploaded image
      },
    };
  } else {
    return {
      success: 0,
      message: "Upload failed",
    };
  }
};
let uploadImageByFile = async (file) => {
  let formData = new FormData();
  formData.append("image", file);

  let response = await fetch("http://localhost:3000/upload-image", {
    method: "POST",
    body: formData,
  });

  if (response.ok) {
    let data = await response.json();
    return {
      success: 1,
      file: {
        url: data.url, // URL of the uploaded image
      },
    };
  } else {
    return {
      success: 0,
      message: "Upload failed",
    };
  }
};

export let tools = {
  embed: Embed,
  list: {
    class: List,
    inlineToolbar: true,
  },
  code: Code,
  image: {
    class: Image,
    config: {
      uploader: {
        uploadByUrl: uploadImageByUrl,
        uploadByFile: uploadImageByFile,
      },
    },
  },
  header: {
    class: Header,
    config: {
      placeholder: "Type Heading...",
      levels: [2, 3],
      default: 2,
    },
  },
  marker: Marker,
  quote: {
    class: Quote,
    inlineToolbar: true,
  },
  inlineCode: InlineCode,
};