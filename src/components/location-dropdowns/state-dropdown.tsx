import { SearchableDropdown } from "../searchable-dropdown/searchable-dropdown";

interface StateDropdownProps {
  value: string;
  onChange: (value: string) => void;
  country?: string;
  placeholder?: string;
}

// Example US states - you'll want to expand this and add other countries
const states = {
  US: [
    { label: "Alabama", value: "AL" },
    { label: "Alaska", value: "AK" },
    { label: "Arizona", value: "AZ" },
    // TODO: Add complete US states list
  ],
  CA: [
    { label: "Alberta", value: "AB" },
    { label: "British Columbia", value: "BC" },
    { label: "Ontario", value: "ON" },
    // TODO: Add complete Canadian provinces list
  ],
};

export const StateDropdown: React.FC<StateDropdownProps> = ({
  value,
  onChange,
  country = "US",
  placeholder = "Choose state/province",
}) => {
  const options = states[country as keyof typeof states] || [];

  return (
    <SearchableDropdown
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
    />
  );
};
