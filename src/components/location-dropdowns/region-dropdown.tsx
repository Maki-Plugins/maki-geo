import { SearchableDropdown } from "../searchable-dropdown/searchable-dropdown";
import regionsData from "../../assets/regions.json";

interface RegionDropdownProps {
  value: string;
  onChange: (value: string) => void;
  country?: string;
  placeholder?: string;
}

interface Region {
  id: number;
  states: {
    id: number;
    name: string;
    state_code: string;
  }[];
}

// Transform the regions data into a more usable format
const regions: { [key: string]: { label: string; value: string }[] } = {};

(regionsData as Region[]).forEach((countryRegions, index) => {
  // Use the index + 1 as the country ID since that's how the data is structured
  const countryId = index + 1;
  regions[countryId] = countryRegions.states.map(state => ({
    label: state.name,
    value: state.name // Using name as value since state_code isn't standardized
  }));
});

export const RegionDropdown: React.FC<RegionDropdownProps> = ({
  value,
  onChange,
  country,
  placeholder = "Choose state/province",
}) => {
  // If no country is selected or country isn't found in regions, show empty list
  const options = country ? (regions[country] || []) : [];

  return (
    <SearchableDropdown
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
    />
  );
};
