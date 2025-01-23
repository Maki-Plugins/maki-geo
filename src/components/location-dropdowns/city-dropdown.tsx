import { SearchableDropdown } from "../searchable-dropdown/searchable-dropdown";

interface CityDropdownProps {
  value: string;
  onChange: (value: string) => void;
  country?: string;
  state?: string;
  placeholder?: string;
}

interface CityOption {
  label: string;
  value: string;
}

export const CityDropdown: React.FC<CityDropdownProps> = ({
  value,
  onChange,
  country,
  state,
  placeholder = "Choose city",
}) => {
  const searchCities = async (searchTerm: string): Promise<CityOption[]> => {
    if (!country || !state) {
      return [];
    }

    try {
      const response = await fetch(
        `/wp-json/maki-geo/v1/cities/search?` +
        new URLSearchParams({
          country,
          state,
          search: searchTerm
        })
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }

      const data = await response.json();
      return data.cities;
    } catch (error) {
      console.error("Failed to search cities:", error);
      return [];
    }
  };

  return (
    <SearchableDropdown
      value={value}
      onChange={onChange}
      onSearch={searchCities}
      placeholder={placeholder}
      minSearchLength={2}
      debounceMs={300}
    />
  );
};
