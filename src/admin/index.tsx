import { render } from "@wordpress/element";
import { Button } from "@wordpress/components";
import apiFetch from "@wordpress/api-fetch";
import { GeoRulesManager } from "../components/geo-rules-manager";
import { useState, useEffect } from "react";
import { GlobalGeoRule } from "../types";

interface ApiResponse {
  success: boolean;
  rules?: GlobalGeoRule[];
  message?: string;
}

declare global {
  interface Window {
    geoUtilsSettings?: {
      globalRules: GlobalGeoRule[];
    };
  }
}

function AdminGeoRules(): JSX.Element {
  const [rules, setRules] = useState<GlobalGeoRule[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    // Load initial rules from WordPress options
    const savedRules = window.geoUtilsSettings?.globalRules || [];
    setRules(savedRules);
  }, []);

  const handleRulesChange = (newRules: GlobalGeoRule[]): void => {
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
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
          className="add-rule-button"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
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
