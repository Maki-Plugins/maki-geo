import { render } from "@wordpress/element";
import { GeoRules } from "../components/geo-rules";
import { useState, useEffect } from "react";

function AdminGeoRules() {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    // Load initial rules from WordPress options
    const savedRules = window.geoUtilsSettings?.rules || [];
    setRules(savedRules);
  }, []);

  const handleRulesChange = (newRules) => {
    setRules(newRules);
    // Save to WordPress options via AJAX
    jQuery.post(ajaxurl, {
      action: "save_geo_rules",
      rules: JSON.stringify(newRules),
      nonce: window.geoUtilsSettings.nonce,
    });
  };

  return (
    <div className="geo-rules-admin-wrapper">
      <GeoRules rules={rules} onChange={handleRulesChange} />
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
