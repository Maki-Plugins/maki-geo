import { SearchableDropdown } from "../searchable-dropdown/searchable-dropdown";
import countryCodesData from "../../assets/country_codes.json";

interface CountryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface CountryCode {
  name: string;
  "alpha-2": string;
  "country-code": string;
}

const countries = (countryCodesData as CountryCode[]).map(country => ({
  label: country.name,
  value: country["alpha-2"]
}));

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
