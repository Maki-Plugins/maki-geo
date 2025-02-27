import { useState } from "@wordpress/element";
import { Redirection } from "../../types/types";
import { NewRedirectionModal } from "../components/NewRedirectionModal";

const dummyRedirections: Redirection[] = [
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
    operator: "OR",
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
    operator: "OR",
    isEnabled: true,
  },
];

export function RedirectionTab(): JSX.Element {
  const [expandedRedirectionId, setExpandedRedirectionId] = useState<
    string | null
  >(null);
  const [redirections, setRedirections] =
    useState<Redirection[]>(dummyRedirections);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleRedirectionComplete = (redirection: Redirection) => {
    setRedirections([
      ...redirections,
      { ...redirection, id: String(Date.now()) },
    ]);
    setIsModalOpen(false);
  };

  const handleDeleteRedirection = (redirectionId: string) => {
    if (window.confirm("Are you sure you want to delete this redirection?")) {
      setRedirections(
        redirections.filter((redirection) => redirection.id !== redirectionId),
      );
    }
  };

  const handleToggleRedirection = (redirectionId: string, enabled: boolean) => {
    setRedirections(
      redirections.map((redirection) =>
        redirection.id === redirectionId
          ? { ...redirection, isEnabled: enabled }
          : redirection,
      ),
    );
  };

  const getLocationSummary = (redirection: Redirection) => {
    const count = redirection.conditions.length;
    const firstLocation = redirection.conditions[0];
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
        <button
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          Add New Redirection
        </button>
      </div>

      <div className="space-y-4">
        {redirections.map((redirection) => (
          <div
            key={redirection.id}
            className="card bg-base-100 shadow-sm rounded-none max-w-full"
          >
            <div className="card-body p-4">
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() =>
                  setExpandedRedirectionId(
                    expandedRedirectionId === redirection.id
                      ? null
                      : redirection.id,
                  )
                }
              >
                <div
                  className={`badge ${
                    redirection.isEnabled
                      ? "badge-success text-success-content"
                      : "badge-error text-error-content"
                  }`}
                >
                  {redirection.isEnabled ? "Enabled" : "Disabled"}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{redirection.name}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-4">
                      <span className="badge badge-outline">
                        {redirection.type}
                      </span>
                      <span>From: {getUrlSummary(redirection.fromUrls)}</span>
                      <span>To: {redirection.toUrl}</span>
                      <span>{getLocationSummary(redirection)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-square btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedRedirectionId(
                        expandedRedirectionId === redirection.id
                          ? null
                          : redirection.id,
                      );
                    }}
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${expandedRedirectionId === redirection.id ? "rotate-180" : ""}`}
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

              {expandedRedirectionId === redirection.id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="space-y-2">
                    <h4 className="font-medium">Source URLs</h4>
                    <ul className="list-disc list-inside">
                      {redirection.fromUrls.map((url, index) => (
                        <li key={index}>{url}</li>
                      ))}
                    </ul>

                    <h4 className="font-medium mt-4">Destination URL</h4>
                    <p>{redirection.toUrl}</p>

                    <h4 className="font-medium mt-4">Conditions</h4>
                    <ul className="list-disc list-inside">
                      {redirection.conditions.map((condition, index) => (
                        <li key={index}>
                          {condition.type} {condition.operator}{" "}
                          {condition.value}
                        </li>
                      ))}
                    </ul>

                    <div className="flex justify-between items-center gap-2 mt-4">
                      <div className="form-control">
                        <label className="label cursor-pointer gap-2">
                          <span className="label-text">Enable redirection</span>
                          <input
                            type="checkbox"
                            className="toggle toggle-success"
                            checked={redirection.isEnabled}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleRedirection(
                                redirection.id,
                                e.target.checked,
                              );
                            }}
                          />
                        </label>
                      </div>
                      <div>
                        <button className="btn btn-sm">Edit</button>
                        <button
                          className="btn btn-sm btn-error ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRedirection(redirection.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <NewRedirectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onComplete={handleRedirectionComplete}
      />
    </div>
  );
}
