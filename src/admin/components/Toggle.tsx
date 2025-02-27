import React from "react";

interface ToggleProps {
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  checked = false,
  onChange,
  className = "",
}) => {
  return (
    <label className={`cursor-pointer flex items-center ${className}`}>
      <input
        type="checkbox"
        className="peer hidden"
        checked={checked}
        onChange={onChange}
      />
      <div
        className="w-12 h-6 bg-base-300 rounded-full relative 
               after:absolute after:left-1 after:top-1 after:bg-white after:w-4 after:h-4 after:rounded-full after:transition-all 
               peer-checked:bg-primary peer-checked:after:translate-x-6"
      ></div>
    </label>
  );
};

export default Toggle;
