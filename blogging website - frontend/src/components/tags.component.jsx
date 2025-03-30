import { useContext } from "react";
import { EditorContext } from "../pages/editor.pages";

function Tag({ tag, tagIndex }) {
  let {
    blog,
    blog: { tags },
    setBlog,
  } = useContext(EditorContext);

  let handleRemoveTag = () => {
    tags = tags.filter((t) => t != tag);
    setBlog({ ...blog, tags });
  };
  let handleTagEdit = (e) => {
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.preventDefault();
      let currentTag = e.target.innerText;
      tags[tagIndex] = currentTag;
      setBlog({ ...blog, tags });
      e.target.setAttribute("contentEditable", false);
    }
  };
  let addEditable = (e) => {
    e.target.setAttribute("contentEditable", true);
    e.target.focus();
  };

  return (
    <div className="relative p-2 mt-2 mr-2 px-5 bg-white rounded-full inline-block hover:bg-opacity-50 pr-10">
      <p
        className="outline-none"
        onKeyDown={handleTagEdit}
        onClick={addEditable}
        contentEditable="true"
      >
        {tag}
      </p>
      <button
        className="mt-[2px] rounded-full absolute right-3 -translate-y-6"
        onClick={handleRemoveTag}
      >
        <i className="fi fi-br-cross text-sm pointer-events-none "></i>
      </button>
    </div>
  );
}
export default Tag;
