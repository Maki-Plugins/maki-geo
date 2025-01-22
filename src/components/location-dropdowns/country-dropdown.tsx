import { SearchableDropdown } from "../searchable-dropdown/searchable-dropdown";

interface CountryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const countries = [
  { label: "United States", value: "US" },
  { label: "Canada", value: "CA" },
  { label: "United Kingdom", value: "GB" },
  // TODO: Add complete country list
];

export const CountryDropdown: React.FC<CountryDropdownProps> = ({
  value,
  onChange,
  placeholder = "Choose country",
}) => {
  return (
    <SearchableDropdown
      value={value}
      onChange={onChange}
      options={countries}
      placeholder={placeholder}
    />
  );
};
