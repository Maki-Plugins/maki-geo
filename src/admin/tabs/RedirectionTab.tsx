import { useState } from "@wordpress/element";
import { Redirection } from "../../types/types";
import { RedirectionCard } from "../components/RedirectionCard";
import { Dashicon } from "@wordpress/components";

export function RedirectionTab(): JSX.Element {
  const [expandedRedirectionId, setExpandedRedirectionId] = useState<
    string | null
  >(null);
  const [redirections, setRedirections] = useState<Redirection[]>([]);
  const [showNewRedirectionCard, setShowNewRedirectionCard] = useState(false);

  const handleRedirectionComplete = (redirection: Redirection) => {
    setRedirections([
      ...redirections,
      { ...redirection, id: String(Date.now()) },
    ]);
    setShowNewRedirectionCard(false);
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
    const count = redirection.locations.length;
    if (count === 0) return "No locations";
    const firstLocation = redirection.locations[0].conditions[0];
    if (!firstLocation) return "No conditions";
    return `${count} ${firstLocation.type}${count > 1 ? "s" : ""} including ${firstLocation.value}${count > 1 ? "..." : ""}`;
  };

  const getUrlSummary = (urls: string[]) => {
    if (urls.length === 0) return "None";
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
          onClick={() => setShowNewRedirectionCard(!showNewRedirectionCard)}
        >
          <Dashicon icon="plus" /> Add New Redirection
        </button>
      </div>

      <div className="space-y-4">
        {showNewRedirectionCard && (
          <RedirectionCard 
            onComplete={handleRedirectionComplete}
            isNew={true}
          />
        )}

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
                        {redirection.locations.length} locations
                      </span>
                      <span>
                        From:{" "}
                        {getUrlSummary(
                          redirection.locations.flatMap((location) =>
                            location.redirectMappings.map(
                              (mapping) => mapping.fromUrl,
                            ),
                          ),
                        )}
                      </span>
                      <span>
                        To:{" "}
                        {getUrlSummary(
                          redirection.locations.flatMap((location) =>
                            location.redirectMappings.map(
                              (mapping) => mapping.toUrl,
                            ),
                          ),
                        )}
                      </span>
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
                  <RedirectionCard
                    onComplete={(updatedRedirection) => {
                      setRedirections(
                        redirections.map((r) =>
                          r.id === redirection.id
                            ? { ...updatedRedirection, id: redirection.id }
                            : r
                        )
                      );
                      setExpandedRedirectionId(null);
                    }}
                    isNew={false}
                    initialData={redirection}
                  />
                  
                  <div className="flex justify-end mt-4">
                    <button
                      className="btn btn-sm btn-error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRedirection(redirection.id);
                      }}
                    >
                      <Dashicon icon="trash" /> Delete
                    </button>
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
