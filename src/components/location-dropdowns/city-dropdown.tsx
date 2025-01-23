import { SearchableDropdown } from "../searchable-dropdown/searchable-dropdown";

interface CityDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface CityOption {
  label: string;
  value: string;
}

export const CityDropdown: React.FC<CityDropdownProps> = ({
  value,
  onChange,
  placeholder = "Choose city",
}) => {
  const searchCities = async (searchTerm: string): Promise<CityOption[]> => {

    try {
      const response = await fetch(
        `/wp-json/maki-geo/v1/city-search?` +
        new URLSearchParams({
          search: searchTerm
        })
      );

      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }

      const data = await response.json();
      console.log(`Raw API response:${JSON.stringify(data)}`);

      return data.cities.map((city: string) => ({
        label: city,
        value: city
      }));
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
