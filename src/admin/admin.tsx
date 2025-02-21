import { render } from "@wordpress/element";
import { useState } from "@wordpress/element";
import makiGeoLogo from "../assets/maki-geo-logo.svg";
import { TabPanel } from "@wordpress/components";
import { AdminTabsProps } from "../types/admin-types";
import { GeoRulesTab } from "./tabs/GeoRulesTab";
import { SettingsTab } from "./tabs/SettingsTab";
import "../styles/tailwind.css";

function AdminTabs({ activeTab, onTabChange }: AdminTabsProps): JSX.Element {
  const tabs = [
    {
      name: "settings",
      title: "General",
      className:
        "mgeo-tab-settings border-solid border-[1px] border-b-0 border-gray-300",
      component: SettingsTab,
    },
    {
      name: "geo-rules",
      title: "Global Geo Rules",
      className:
        "mgeo-tab-geo-rules border-solid border-[1px] border-b-0 border-gray-300",
      component: GeoRulesTab,
    },
  ];

  return (
    <TabPanel
      className="mgeo-admin-tabs"
      activeClass="border-gray-700 bg-white"
      tabs={tabs}
      onSelect={onTabChange}
      selected={activeTab}
    >
      {(tab) => {
        const TabComponent = tab.component;
        return <TabComponent />;
      }}
    </TabPanel>
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
