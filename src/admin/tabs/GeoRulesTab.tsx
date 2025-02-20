import { useState, useEffect } from "@wordpress/element";
import { GeoRulesManager } from "../../components/geo-rules-manager/geo-rules-manager";
import { Button } from "@wordpress/components";
import apiFetch from "@wordpress/api-fetch";
import { GlobalGeoRule } from "../../types/types";

interface ApiResponse {
  success: boolean;
  rules?: GlobalGeoRule[];
  message?: string;
}

export function GeoRulesTab(): JSX.Element {
  const [rules, setRules] = useState<GlobalGeoRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load initial rules from WordPress options
    const savedRules = window.makiGeoData?.globalRules || [];
    setRules(savedRules);
  }, []);

  const handleRulesChange = (newRules: GlobalGeoRule[]): void => {
    setRules(newRules);
  };

  const handleSave = async (): Promise<void> => {
    setIsSaving(true);
    try {
      const response: ApiResponse = await apiFetch({
        path: "maki-geo/v1/rules",
        method: "POST",
        data: rules,
      });

      if (response.success) {
        alert("Rules saved successfully!");
      }
    } catch (error) {
      console.error("Failed to save rules:", error);
      alert("Failed to save rules. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mgeo-admin-card bg-white border border-gray-300 p-5 mb-5 rounded">
      <h2>Global Geo Rules</h2>
      <p>Configure global geo-targeting rules that you can reuse site-wide.</p>
      <div className="flex flex-col">
        <GeoRulesManager rules={rules} onChange={handleRulesChange} />
        <div className="mt-5 p-2.5">
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
    </div>
  );
}
