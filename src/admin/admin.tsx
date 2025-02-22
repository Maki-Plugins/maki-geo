import { render } from "@wordpress/element";
import { useState } from "@wordpress/element";
import { Dashicon } from "@wordpress/components";
import makiGeoLogo from "../assets/maki-geo-logo.svg";
import { AdminTabsProps } from "../types/admin-types";
import { GeoRulesTab } from "./tabs/GeoRulesTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { RedirectionTab } from "./tabs/RedirectionTab";
import "../styles/tailwind.css";

function AdminTabs({ activeTab, onTabChange }: AdminTabsProps): JSX.Element {
  const tabs = [
    {
      id: "settings",
      label: "General settings",
      icon: <Dashicon icon="admin-generic" />,
    },
    {
      id: "geo-rules",
      label: "Global Geo Rules",
      icon: <Dashicon icon="list-view" />,
    },
    {
      id: "redirection",
      label: "Geo Redirection",
      icon: <Dashicon icon="randomize" />,
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="">
        <nav className="flex gap-2 items-end max-w-2xl" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 flex items-end justify-center gap-1 px-6 text-base rounded-none text-gray-700
                ${
                  activeTab === tab.id
                    ? "bg-white py-3 hard-shadow border-gray-300"
                    : " py-2 bg-[#D4D1D0] hover:hard-shadow hover:py-3"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white hard-shadow">
        <div className={activeTab === "settings" ? "block" : "hidden"}>
          <SettingsTab />
        </div>
        <div className={activeTab === "geo-rules" ? "block" : "hidden"}>
          <GeoRulesTab />
        </div>
        <div className={activeTab === "redirection" ? "block" : "hidden"}>
          <RedirectionTab />
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
