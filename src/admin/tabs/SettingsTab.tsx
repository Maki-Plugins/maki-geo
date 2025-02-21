import { useState, useEffect } from "@wordpress/element";
import { Button, SelectControl, TextControl } from "@wordpress/components";
import apiFetch from "@wordpress/api-fetch";
import { AdminSettings, ApiKeyResponse } from "../../types/admin-types";
import { MGEO_MAKI_PLUGINS_URL } from "../../constants";

function SettingRow({
  title,
  description,
  settingElement,
}: {
  title: string;
  description: string | JSX.Element;
  settingElement: JSX.Element;
}) {
  return (
    <>
      <div className="grid grid-cols-[1fr_3fr] gap-7 py-4 border-t border-solid border-t-gray-300">
        <div className="text-right font-semibold mt-2">{title}</div>
        <div>
          {settingElement}
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </>
  );
}

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
      const settings = await apiFetch({
        path: "/wp/v2/settings",
        method: "GET",
        credentials: "include",
      });

      setSettings({
        clientServerMode: settings.mgeo_client_server_mode,
        apiKey: settings.mgeo_api_key,
        monthlyRequests: settings.mgeo_monthly_requests,
        requestLimit: settings.mgeo_request_limit,
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
          path: "/wp/v2/settings",
          method: "POST",
          data: {
            mgeo_client_server_mode: settings.clientServerMode,
            mgeo_api_key: settings.apiKey,
          },
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
      <div className="bg-white border border-gray-600 mb-5 rounded-none grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-5">
        <div className="p-5">
          <h2 className="text-2xl font-bold mb-2">General Settings</h2>
          <p className="mb-3">
            Change the general Maki Geo settings for this website.
          </p>
          <SettingRow
            title="Geo Targeting Method"
            description={
              <>
                <b>Server-side:</b> Processes geo location on the server before
                the page loads. <br />
                <b>Client-side:</b> Uses AJAX to evaluate geo location in the
                browser after the page loads. This works better with caching
                plugins but is slightly slower and requires javascript.
                <br />
                <br />
                We recommend using Server-side unless you're experiencing wrong
                location detection due to caching.
              </>
            }
            settingElement={
              <SelectControl
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
              />
            }
          />
          <SettingRow
            title="API Key"
            description={
              <>
                Enter your API key to increase your monthly request limit.{" "}
                <a
                  className="underline text-blue-950"
                  href={`${MGEO_MAKI_PLUGINS_URL}#pricing`}
                  target="_blank"
                >
                  Get an API key
                </a>
              </>
            }
            settingElement={
              <>
                <TextControl
                  value={settings.apiKey}
                  onChange={(value) =>
                    setSettings({ ...settings, apiKey: value })
                  }
                />
                <Button
                  className="mb-4 hover:bg-gray-100"
                  variant="secondary"
                  onClick={handleVerifyApiKey}
                  style={{ marginTop: "8px" }}
                >
                  Verify Key
                </Button>
              </>
            }
          />
          <Button
            variant="primary"
            onClick={saveSettings}
            disabled={isSaving}
            style={{ marginTop: "20px" }}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
          <hr style={{ margin: "20px 0" }} />
          <h3 className="text-lg font-semibold mb-5">Danger Zone</h3>
          <Button
            className="hover:bg-gray-100"
            variant="secondary"
            isDestructive
            onClick={handleDeleteAllRules}
          >
            Delete All Global Geo Rules
          </Button>
        </div>
        <div className="md:border-l border-solid border-l-gray-600 p-5">
          <h2 className="text-2xl font-bold mb-3">Statistics</h2>
          <div className="bg-gray-50 p-4 rounded text-center">
            <h3>Location API Requests this month</h3>
            <p className="text-2xl font-bold my-2.5 text-blue-600">
              {settings.monthlyRequests}
            </p>
            <p className="text-gray-600">
              Limit: {settings.requestLimit} (
              {Math.max(0, settings.requestLimit - settings.monthlyRequests)}{" "}
              remaining)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
