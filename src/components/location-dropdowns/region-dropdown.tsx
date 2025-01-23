import { SearchableDropdown } from "../searchable-dropdown/searchable-dropdown";
import regionsData from "../../assets/regions.json";

interface RegionDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Transform the regions data into a flat list of unique regions
const regions = Array.from(
  new Set((regionsData as string[])
  )
).sort().map(name => ({
  label: name,
  value: name
}));

export const RegionDropdown: React.FC<RegionDropdownProps> = ({
  value,
  onChange,
  placeholder = "Choose state/province",
}) => {

  return (
    <SearchableDropdown
      value={value}
      onChange={onChange}
      options={regions}
      placeholder={placeholder}
      minSearchLength={1}
    />
  );
};
