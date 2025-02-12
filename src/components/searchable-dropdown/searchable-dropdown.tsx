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
  onSearch?: (term: string) => Promise<Option[]>;
  options?: Option[];
  placeholder?: string;
  minSearchLength?: number;
  debounceMs?: number;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  onSearch,
  options: staticOptions,
  placeholder = "Search...",
  minSearchLength = 3,
  debounceMs = 150,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [options, setOptions] = useState<Option[]>(staticOptions ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Find the label for the current value, or use the value itself if not found
  const currentLabel = options.find((opt) => opt.value === value)?.label || value;

  useEffect(() => {
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

  const filterStaticOptions = (term: string) => {
    if (!staticOptions) return [];
    return staticOptions.filter((option) =>
      option.label.toLowerCase().includes(term.toLowerCase())
    );
  };

  const handleSearch = async (term: string) => {
    if (!onSearch) {
      setOptions(filterStaticOptions(term));
      return;
    }

    if (term.length < minSearchLength) {
      setOptions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await onSearch(term);
      setOptions(results);
    } catch (error) {
      console.error('Search failed:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = (term: string) => {
    if (!onSearch) {
      handleSearch(term);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(term);
    }, debounceMs);
  };

  // Initialize options with static options if provided
  useEffect(() => {
    if (staticOptions) {
      setOptions(staticOptions);
    }
  }, [staticOptions]);

  return (
    <div className="searchable-dropdown" ref={dropdownRef}>
      <TextControl
        className="mgeo-geo-rule-select"
        __nextHasNoMarginBottom={true}
        value={isOpen ? searchTerm : currentLabel}
        onChange={(newValue) => {
          setSearchTerm(newValue);
          setIsOpen(true);
          onChange(newValue);
          debouncedSearch(newValue);
        }}
        placeholder={placeholder}
        onFocus={() => {
          setIsOpen(true);
          setSearchTerm(currentLabel);
          if (currentLabel) {
            debouncedSearch(currentLabel);
          }
        }}
      />
      {isOpen && options.length > 0 && (
        <div className="searchable-dropdown__options">
          {isLoading && (<div
            className="searchable-dropdown__option"
          >
            Loading...
          </div>)}
          {!isLoading && options.map((option) => (
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
