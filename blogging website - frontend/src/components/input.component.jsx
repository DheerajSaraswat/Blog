import { useState } from "react";

let InputBox = ({name, type, id, value, placeholder, iconName, disable = false})=>{

    let [passwordVisible, setPasswordVisible] = useState(false)

    return (
      <div className="relative w-[100%] mb-4">
        <input
          name={name}
          type={type}
          id={id}
          defaultValue={value}
          placeholder={placeholder}
          className="input-box"
          disabled={disable}
        />
        <i className={"fi " + iconName + " input-icon"}></i>
      </div>
    );
}
export default InputBox