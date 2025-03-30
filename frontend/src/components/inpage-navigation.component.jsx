import { useRef, useState, useEffect } from "react";

export let activeTabLineRef;
export let activeTabRef;

function InPageNavigation({
  routes,
  defaultHidden = [],
  defaultActiveIndex = 0,
  children,
}) {
  activeTabLineRef = useRef(); //used for hr
  activeTabRef = useRef();
  const [inPageNavIndex, setInPageNavIndex] = useState(defaultActiveIndex);
  const [width, setWidth] = useState(window.innerWidth);
  const [isResizeEventAdded, setIsResizeEventAdded] = useState(false);

  const changePageState = (btn, i) => {
    const { offsetWidth, offsetLeft } = btn;
    activeTabLineRef.current.style.width = offsetWidth + "px";
    activeTabLineRef.current.style.left = offsetLeft + "px";
    setInPageNavIndex(i);
  };

  //by default hr appears under home
  useEffect(() => {
    if (width > 766 && inPageNavIndex != defaultActiveIndex) {
      changePageState(activeTabRef.current, defaultActiveIndex);
    }

    if (!isResizeEventAdded) {
      window.addEventListener("resize", () => {
        if (!isResizeEventAdded) {
          setIsResizeEventAdded(true);
        }
        setWidth(window.innerWidth);
      });
    }
  }, [width]);

  return (
    <>
      <div className="relative mb-8 bg-white border-b border-grey flex flex-nowrap overflow-x-auto">
        {routes.map((route, i) => {
          return (
            <button
              key={i}
              className={
                "p-4 px-5 capitalize " +
                (inPageNavIndex == i ? "text-black " : "text-dark-grey ") +
                (defaultHidden.includes(route) ? "md:hidden " : " ")
              }
              onClick={(e) => {
                changePageState(e.target, i);
              }}
              ref={i == defaultActiveIndex ? activeTabRef : null}
            >
              {route}
            </button>
          );
        })}
        <hr ref={activeTabLineRef} className="absolute bottom-0 duration-300 border-dark-grey" />
      </div>
      {Array.isArray(children) ? children[inPageNavIndex] : children}
    </>
  );
}
export default InPageNavigation;
