import { useState, useEffect } from "@wordpress/element";
import { Button, SelectControl, TextControl } from "@wordpress/components";
import apiFetch from "@wordpress/api-fetch";
import { AdminSettings, ApiKeyResponse } from "../../types/admin-types";

export function SettingsTab(): JSX.Element {
  const [settings, setSettings] = useState<AdminSettings>({
    clientServerMode: "server",
    apiKey: "",
    monthlyRequests: 0,
    requestLimit: 1000,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [clientServerMode, apiKey, monthlyRequests, requestLimit] =
        await Promise.all([
          apiFetch({ path: "/wp/v2/settings/mgeo_client_server_mode" }),
          apiFetch({ path: "/wp/v2/settings/mgeo_api_key" }),
          apiFetch({ path: "/wp/v2/settings/mgeo_monthly_requests" }),
          apiFetch({ path: "/wp/v2/settings/mgeo_request_limit" }),
        ]);

      setSettings({
        clientServerMode,
        apiKey,
        monthlyRequests,
        requestLimit,
      });
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  };

  const handleVerifyApiKey = async () => {
    try {
      const response: ApiKeyResponse = await apiFetch({
        path: "maki-geo/v1/verify-key",
        method: "POST",
        data: { api_key: settings.apiKey },
      });

      if (response.success) {
        alert(
          `API key verified successfully! Monthly limit: ${response.data?.monthly_limit}`,
        );
      } else {
        alert("Invalid API key. Please check and try again.");
      }
    } catch (error) {
      console.error("Failed to verify key:", error);
      alert("Failed to verify API key. Please try again.");
    }
  };

  const handleDeleteAllRules = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all geo rules? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch({
        path: "maki-geo/v1/rules",
        method: "DELETE",
      });

      if (response.success) {
        alert("All rules have been deleted successfully.");
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to delete rules:", error);
      alert("Failed to delete rules. Please try again.");
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        apiFetch({
          path: "/wp/v2/settings/mgeo_client_server_mode",
          method: "POST",
          data: settings.clientServerMode,
        }),
        apiFetch({
          path: "/wp/v2/settings/mgeo_api_key",
          method: "POST",
           settings.apiKey,
        }),
      ]);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mgeo-settings-tab">
      <div className="mgeo-admin-card">
        <h2>General Settings</h2>

        <SelectControl
          label="Geo Targeting Method"
          value={settings.clientServerMode}
          options={[
            { label: "Server-side (Default)", value: "server" },
            { label: "Client-side", value: "client" },
          ]}
          onChange={(value) =>
            setSettings({
              ...settings,
              clientServerMode: value as "server" | "client",
            })
          }
          help="Server-side: Processes geo location on the server when the page loads. Client-side: Uses AJAX to evaluate geo location in the browser."
        />

        <TextControl
          label="API Key"
          value={settings.apiKey}
          onChange={(value) => setSettings({ ...settings, apiKey: value })}
        />
        <Button
          variant="secondary"
          onClick={handleVerifyApiKey}
          style={{ marginTop: "8px" }}
        >
          Verify Key
        </Button>

        <div className="mgeo-stats-grid" style={{ marginTop: "20px" }}>
          <div className="mgeo-stat-box">
            <h3>Location API Requests this month</h3>
            <p className="mgeo-stat-number">{settings.monthlyRequests}</p>
            <p className="mgeo-stat-subtext">
              Limit: {settings.requestLimit} (
              {Math.max(0, settings.requestLimit - settings.monthlyRequests)}{" "}
              remaining)
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={saveSettings}
          disabled={isSaving}
          style={{ marginTop: "20px" }}
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>

        <hr style={{ margin: "20px 0" }} />

        <h3>Danger Zone</h3>
        <Button
          variant="secondary"
          isDestructive
          onClick={handleDeleteAllRules}
        >
          Delete All Global Geo Rules
        </Button>
      </div>
    </div>
  );
}
