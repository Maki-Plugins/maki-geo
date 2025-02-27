import { Dashicon } from "@wordpress/components";
import React from "react";

interface HelpHoverProps {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const HelpHover: React.FC<HelpHoverProps> = ({
  text,
  position = "top",
  className = "",
}) => {
  return (
    <div
      className={`ml-1 tooltip tooltip-${position} ${className}`}
      data-tip={text}
    >
      <span className="cursor-help text-gray-500 hover:text-gray-700">
        <Dashicon icon="editor-help" />
      </span>
    </div>
  );
};

export default HelpHover;
