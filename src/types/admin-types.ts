export interface AdminSettings {
  clientServerMode: "server" | "client";
  apiKey: string;
  monthlyRequests: number;
  requestLimit: number;
}

export interface TabProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export interface AdminTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export interface SettingsTabProps {
  settings: AdminSettings;
  onSettingsChange: (settings: Partial<AdminSettings>) => void;
  onVerifyApiKey: (apiKey: string) => Promise<void>;
  onDeleteAllRules: () => Promise<void>;
}

export interface ApiKeyResponse {
  success: boolean;
  data?: {
    monthly_limit: number;
  };
  message?: string;
}
