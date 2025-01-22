import { useEffect, useState } from "react";
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
  const [cities, setCities] = useState<CityOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadCities = async () => {
      if (!country || !state) {
        setCities([]);
        return;
      }

      setIsLoading(true);
      try {
        // TODO: Replace with actual API call to get cities
        // This is just an example structure
        const response = await fetch(
          `/wp-json/maki-geo/v1/cities?country=${country}&state=${state}`
        );
        const data = await response.json();
        setCities(data.cities);
      } catch (error) {
        console.error("Failed to load cities:", error);
        setCities([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCities();
  }, [country, state]);

  return (
    <SearchableDropdown
      value={value}
      onChange={onChange}
      options={cities}
      placeholder={isLoading ? "Loading cities..." : placeholder}
    />
  );
};
