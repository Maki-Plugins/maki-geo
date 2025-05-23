import { useState } from "@wordpress/element";
import { Dashicon } from "@wordpress/components";
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
      <div className="grid grid-cols-[1fr_3fr] gap-7 py-4">
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
  const [settings, setSettings] = useState<AdminSettings>(
    window.makiGeoData?.settings || {
      clientServerMode: "server",
      apiKey: "",
      monthlyRequests: 0,
      requestLimit: 1000,
    },
  );
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
      // Clear success message after 5 seconds
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mgeo-settings-tab">
      <div className="mb-5 grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-5">
        <div className="p-5">
          <h2 className="text-2xl mb-2 text-secondary">General settings</h2>
          <p className="mb-3">
            Change the general Maki Geo settings for this website.
          </p>
          <div className="divider before:h-2 after:h-2"></div>
          <SettingRow
            title="Geo targeting method"
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
                <option label="Server-side (default)">server</option>
                <option label="Client-side">client</option>
              </select>
            }
          />
          <SettingRow
            title="API key"
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
                    className="btn btn-sm btn-accent btn-outline join-item"
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
                <>
                  <Dashicon icon="saved" /> Save settings
                </>
              )}
            </button>
            {saveSuccess && (
              <p className="text-green-600 mt-2">
                Settings saved successfully!
              </p>
            )}
          </div>
        </div>
        <div className=" p-5">
          <h2 className="text-2xl mb-2 text-secondary">Statistics</h2>
          <div className="stats w-full rounded-none">
            <div className="stat place-items-center text-accent">
              <div className="stat-title">Location API requests this month</div>
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
