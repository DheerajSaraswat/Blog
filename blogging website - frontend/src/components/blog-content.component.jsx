let Img = ({ url, caption }) => {
  return (
    <div>
      <img src={url} />
      {caption.length ? (
        <p className="w-full text-center my-3 md:mb-12 text-base text-dark-grey">
          {caption}
        </p>
      ) : (
        ""
      )}
    </div>
  );
};
let Quote = ({ quote, caption }) => {
  return (
    <div className="bg-purple/10 p-3 pl-5 border-l-4 border-purple">
      <p className="text-xl leading-10 md:text-2xl ">{quote}</p>
      {caption.length ? (
        <p className="w-full text-purp text-base">{caption}</p>
      ) : (
        ""
      )}
    </div>
  );
};
let List = ({ style, items }) => {
  return (
    <ol
      className={`pl-5 ${style == "ordered" ? " list-decimal" : " list-disc"}`}
    >
      {items.map((item, i) => {
        return (
          <li
            key={i}
            className="my-4"
            dangerouslySetInnerHTML={{ __html: item }}
          ></li>
        );
      })}
    </ol>
  );
};
let Code = ({code, style})=>{
    return (
        <pre  className={`bg-purple/10 pl-6 py-4 overflow-x-auto whitespace-pre-wrap rounded-md ${style}`}>
            <code className="font-mono text-xl">
                {code}
            </code>
        </pre>
    )
}


function BlogContent({ block }) {
  let { type, data } = block;
  if (type == "paragraph") {
    return <p dangerouslySetInnerHTML={{ __html: data.text }}></p>;
  }
  if (type == "header") {
    if (data.length == 3) {
      return (
        <h3
          className="text-3xl font-bold"
          dangerouslySetInnerHTML={{ __html: data.text }}
        ></h3>
      );
    }
    return (
      <h2
        className="text-4xl font-bold"
        dangerouslySetInnerHTML={{ __html: data.text }}
      ></h2>
    );
  }
  if (type == "image") {
    return <Img url={data.file.url} caption={data.caption} />;
  }
  if (type == "quote") {
    return <Quote quote={data.text} caption={data.caption} />;
  }
  if (type == "list") {
    return <List style={data.style} items={data.items} />;
  }
  if(type =="code"){
    return <Code code={data.code} style={data.style}/>
  }
  else {
    return <div>Unsupported block type</div>;
  }
}
export default BlogContent;
