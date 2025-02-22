import { render } from "@wordpress/element";
import { useState } from "@wordpress/element";
import makiGeoLogo from "../assets/maki-geo-logo.svg";
import { AdminTabsProps } from "../types/admin-types";
import { GeoRulesTab } from "./tabs/GeoRulesTab";
import { SettingsTab } from "./tabs/SettingsTab";
import "../styles/tailwind.css";

function AdminTabs({ activeTab, onTabChange }: AdminTabsProps): JSX.Element {
  const tabs = [
    { id: "settings", label: "General" },
    { id: "geo-rules", label: "Global Geo Rules" },
  ];

  return (
    <div className="flex flex-col">
      <div className="border-b border-gray-300">
        <nav className="flex gap-2" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                px-4 py-2 text-sm font-medium rounded-t-lg
                ${
                  activeTab === tab.id
                    ? "bg-white text-blue-600 border-t border-x border-gray-300"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-4">
        <div className={activeTab === "settings" ? "block" : "hidden"}>
          <SettingsTab />
        </div>
        <div className={activeTab === "geo-rules" ? "block" : "hidden"}>
          <GeoRulesTab />
        </div>
      </div>
    </div>
  );
}

function Admin(): JSX.Element {
  const [activeTab, setActiveTab] = useState("settings");

  return (
    <div className="wrap maki-geo">
      <h1 className="flex items-center gap-2">
        <div className="text-4xl flex flex-row items-center gap-3 m-5 justify-center tracking-tighter font-light">
          <img className="h-16 w-16" src={makiGeoLogo} alt="Maki Geo Logo" />
          Maki Geo
        </div>
      </h1>
      <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("maki-geo-admin-root");
  if (container) {
    render(<Admin />, container);
  }
});
