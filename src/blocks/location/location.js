import { registerBlockType } from "@wordpress/blocks";
import { useState } from "@wordpress/element";
import metadata from "./block.json";

registerBlockType(metadata.name, {
  edit: () => {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const geoUtilsData = window.geoUtilsData || {};

    const fetchLocation = async () => {
      setLoading(true);
      try {
        const response = await fetch(geoUtilsData.endpoint, {
          method: "GET",
          headers: {
            "X-WP-Nonce": geoUtilsData.nonce,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch location data");
        }

        const data = await response.json();
        setLocation(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <h3>User Location Block</h3>
        <button onClick={fetchLocation} disabled={loading}>
          {loading ? "Loading..." : "Get Location"}
        </button>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {location && (
          <div>
            <p>City: {location.city}</p>
            <p>Country: {location.country}</p>
          </div>
        )}
      </div>
    );
  },
  save: () => {
    return <p>This block displays the user’s location dynamically.</p>;
  },
});
