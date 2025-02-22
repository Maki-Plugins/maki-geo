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
          <p className="text-gray-600 mt-2">{description}</p>
        </div>
      </div>
    </>
  );
}

export function SettingsTab(): JSX.Element {
  const [settings, setSettings] = useState<AdminSettings>(window.makiGeoData?.settings || {
    clientServerMode: "server",
    apiKey: "",
    monthlyRequests: 0,
    requestLimit: 1000,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      setSaveSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mgeo-settings-tab">
      <div className="bg-white border border-gray-300 mb-5 grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-5">
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
              <select
                className="select select-sm"
                value={settings.clientServerMode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    clientServerMode: e.target.value as "server" | "client",
                  })
                }
              >
                <option label="Server-side (Default)">server</option>
                <option label="Client-side">client</option>
              </select>
            }
          />
          <SettingRow
            title="API Key"
            description={
              <>
                Enter your API key to increase your monthly request limit.{" "}
                <a
                  className="link"
                  href={`${MGEO_MAKI_PLUGINS_URL}#pricing`}
                  target="_blank"
                >
                  Get an API key
                </a>
              </>
            }
            settingElement={
              <>
                <div className="join">
                  <input
                    value={settings.apiKey}
                    onChange={(e) =>
                      setSettings({ ...settings, apiKey: e.target.value })
                    }
                    className="input input-bordered input-sm w-full max-w-xs join-item"
                    placeholder="Api key"
                  />
                  <button
                    className="btn btn-sm btn-secondary btn-outline join-item"
                    onClick={handleVerifyApiKey}
                  >
                    Verify key
                  </button>
                </div>
              </>
            }
          />
          <div className="mt-5">
            <button
              className="btn btn-primary"
              onClick={saveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="loading loading-spinner"></span>Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </button>
            {saveSuccess && (
              <p className="text-green-600 mt-2">
                Settings saved successfully!
              </p>
            )}
          </div>
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
        <div className=" p-5">
          <h2 className="text-2xl font-bold mb-3">Statistics</h2>
          <div className="stats shadow w-full">
            <div className="stat place-items-center text-accent">
              <div className="stat-title">Location API Requests this month</div>
              <div className="stat-value">{settings.monthlyRequests}</div>
              <div className="stat-desc">
                Limit: {settings.requestLimit} (
                {Math.max(0, settings.requestLimit - settings.monthlyRequests)}{" "}
                remaining)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
