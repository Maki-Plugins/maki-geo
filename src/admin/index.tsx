import { render } from "@wordpress/element";
import apiFetch from "@wordpress/api-fetch";
import { GeoRulesManager } from "../components/geo-rules-manager";
import { useState, useEffect } from "react";
import { GlobalRule } from "../types";

interface ApiResponse {
  success: boolean;
  rules?: GlobalRule[];
  message?: string;
}

declare global {
  interface Window {
    geoUtilsSettings?: {
      rules: GlobalRule[];
    };
  }
}

function AdminGeoRules(): JSX.Element {
  const [rules, setRules] = useState<GlobalRule[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    // Load initial rules from WordPress options
    const savedRules = window.geoUtilsSettings?.rules || [];
    setRules(savedRules);
  }, []);

  const handleRulesChange = (newRules: GlobalRule[]): void => {
    setRules(newRules);
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      const response: ApiResponse = await apiFetch({
        path: "geoutils/v1/rules",
        method: "POST",
        data: rules,
      });

      if (response.success) {
        // Maybe show a success notice
      }
    } catch (error) {
      console.error("Failed to save rules:", error);
      // Maybe show an error notice
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="geo-rules-admin-wrapper">
      <GeoRulesManager rules={rules} onChange={handleRulesChange} />
      <div className="geo-rules-save-button">
        <button 
          className="button button-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
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
