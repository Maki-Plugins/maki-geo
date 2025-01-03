import { render } from "@wordpress/element";
import apiFetch from "@wordpress/api-fetch";
import { GeoRulesManager } from "../components/geo-rules-manager";
import { useState, useEffect } from "react";

function AdminGeoRules() {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    // Load initial rules from WordPress options
    const savedRules = window.geoUtilsSettings?.rules || [];
    setRules(savedRules);
  }, []);

  const handleRulesChange = async (newRules) => {
    try {
      const response = await apiFetch({
        path: "geoutils/v1/rules",
        method: "POST",
        data: newRules,
      });

      if (response.success) {
        setRules(newRules);
      }
    } catch (error) {
      console.error("Failed to save rules:", error);
    }
  };

  return (
    <div className="geo-rules-admin-wrapper">
      <GeoRulesManager rules={rules} onChange={handleRulesChange} />
    </div>
  );
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("geo-rules-admin");
  if (container) {
    render(<AdminGeoRules />, container);
  }
});
