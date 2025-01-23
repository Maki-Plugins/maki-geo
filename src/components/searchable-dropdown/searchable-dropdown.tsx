import { useState, useRef, useEffect } from "react";
import { TextControl } from "@wordpress/components";
import "./searchable-dropdown.css";

interface Option {
  label: string;
  value: string;
}

interface SearchableDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Search...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the label for the current value, or use the value itself if not found
  const currentLabel = options.find((opt) => opt.value === value)?.label || value;

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="searchable-dropdown" ref={dropdownRef}>
      <TextControl
        value={isOpen ? searchTerm : currentLabel}
        onChange={(newValue) => {
          setSearchTerm(newValue);
          setIsOpen(true);
          onChange(newValue); // Also update the actual value as the user types
        }}
        placeholder={placeholder}
        onFocus={() => {
          setIsOpen(true);
          setSearchTerm(currentLabel);
        }}
      />
      {isOpen && (
        <div className="searchable-dropdown__options">
          {filteredOptions.map((option) => (
            <div
              key={option.value}
              className="searchable-dropdown__option"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                setSearchTerm("");
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
