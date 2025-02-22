import { useState } from "@wordpress/element";
import { RedirectionRule } from "../../types/types";

const dummyRules: RedirectionRule[] = [
  {
    id: "1",
    name: "US/CA to English",
    type: "one-way",
    fromUrls: ["https://example.com/*"],
    toUrl: "https://example.com/en/*",
    conditions: [
      { type: "country", value: "US", operator: "is" },
      { type: "country", value: "CA", operator: "is" },
    ],
    isEnabled: true,
  },
  {
    id: "2",
    name: "EU Multi-domain",
    type: "multi-domain",
    fromUrls: [
      "https://example.com/*",
      "https://example.de/*",
      "https://example.fr/*",
    ],
    toUrl: "https://eu.example.com/*",
    conditions: [{ type: "continent", value: "EU", operator: "is" }],
    isEnabled: true,
  },
];

export function RedirectionTab(): JSX.Element {
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [rules] = useState<RedirectionRule[]>(dummyRules);

  const getLocationSummary = (rule: RedirectionRule) => {
    const count = rule.conditions.length;
    const firstLocation = rule.conditions[0];
    return `${count} ${firstLocation.type}${count > 1 ? "s" : ""} including ${firstLocation.value}${count > 1 ? "..." : ""}`;
  };

  const getUrlSummary = (urls: string[]) => {
    if (urls.length === 1) return urls[0];
    return `${urls[0]} +${urls.length - 1} more`;
  };

  return (
    <div className="p-5">
      <div className="mb-5 flex justify-between items-center">
        <div>
          <h2 className="text-2xl mb-2 text-secondary">Geo Redirection</h2>
          <p className="text-gray-600">
            Manage your geo-based URL redirections
          </p>
        </div>
        <button className="btn btn-primary">Add New Rule</button>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="card bg-base-100 shadow-sm rounded-none max-w-full"
          >
            <div
              className="card-body p-4 cursor-pointer"
              onClick={() =>
                setExpandedRuleId(expandedRuleId === rule.id ? null : rule.id)
              }
            >
              <div className="flex items-center gap-4">
                <div 
                  className={`badge ${
                    rule.isEnabled 
                      ? "badge-success text-white" 
                      : "badge-error text-white"
                  }`}
                >
                  {rule.isEnabled ? "Enabled" : "Disabled"}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{rule.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-4">
                      <span className="badge badge-outline">{rule.type}</span>
                      <span>From: {getUrlSummary(rule.fromUrls)}</span>
                      <span>To: {rule.toUrl}</span>
                      <span>{getLocationSummary(rule)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-square btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedRuleId(
                        expandedRuleId === rule.id ? null : rule.id,
                      );
                    }}
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${expandedRuleId === rule.id ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {expandedRuleId === rule.id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="space-y-2">
                    <h4 className="font-medium">Source URLs</h4>
                    <ul className="list-disc list-inside">
                      {rule.fromUrls.map((url, index) => (
                        <li key={index}>{url}</li>
                      ))}
                    </ul>

                    <h4 className="font-medium mt-4">Destination URL</h4>
                    <p>{rule.toUrl}</p>

                    <h4 className="font-medium mt-4">Conditions</h4>
                    <ul className="list-disc list-inside">
                      {rule.conditions.map((condition, index) => (
                        <li key={index}>
                          {condition.type} {condition.operator}{" "}
                          {condition.value}
                        </li>
                      ))}
                    </ul>

                    <div className="flex justify-end gap-2 mt-4">
                      <button className="btn btn-sm">Edit</button>
                      <button className="btn btn-sm btn-error">Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
