import { render } from "@wordpress/element";
import { useState } from "@wordpress/element";
import makiGeoLogo from "../assets/maki-geo-logo.svg";
import { TabPanel } from "@wordpress/components";
import { AdminTabsProps } from "../types/admin-types";
import { GeoRulesTab } from "./tabs/GeoRulesTab";
import { SettingsTab } from "./tabs/SettingsTab";

function AdminTabs({ activeTab, onTabChange }: AdminTabsProps): JSX.Element {
  const tabs = [
    {
      name: "settings",
      title: "General",
      className: "mgeo-tab-settings",
      component: SettingsTab,
    },
    {
      name: "geo-rules",
      title: "Global Geo Rules",
      className: "mgeo-tab-geo-rules",
      component: GeoRulesTab,
    },
  ];

  return (
    <TabPanel
      className="mgeo-admin-tabs"
      activeClass="border-solid border-0 border-b-2 border-blue-500"
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
    <div className="wrap maki-geo bg-white">
      <h1 className="flex items-center gap-2">
        <img className="w-6" src={makiGeoLogo} alt="Maki Geo Logo" />
        Maki Geo Settings
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
