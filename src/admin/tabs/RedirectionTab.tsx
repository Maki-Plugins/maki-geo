import { useState } from "@wordpress/element";
import { Redirection } from "../../types/types";
import { RedirectionCard } from "../components/RedirectionCard";
import { Dashicon } from "@wordpress/components";

export function RedirectionTab(): JSX.Element {
  const [expandedRedirectionId, setExpandedRedirectionId] = useState<
    string | null
  >(null);
  const [redirections, setRedirections] = useState<Redirection[]>([]);
  const [newRedirectionId, setNewRedirectionId] = useState<string | null>(null);

  const handleRedirectionComplete = (redirection: Redirection) => {
    setRedirections([
      ...redirections,
      { ...redirection, id: String(Date.now()) },
    ]);
    setNewRedirectionId(null);
  };

  const handleDeleteRedirection = (redirectionId: string) => {
    if (window.confirm("Are you sure you want to delete this redirection?")) {
      setRedirections(
        redirections.filter((redirection) => redirection.id !== redirectionId),
      );
    }
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
          onClick={() => {
            const id = `new_${Date.now()}`;
            setNewRedirectionId(id);
            setExpandedRedirectionId(id);
          }}
        >
          <Dashicon icon="plus" /> Add New Redirection
        </button>
      </div>

      <div className="space-y-4">
        {newRedirectionId && (
          <div
            key={newRedirectionId}
            className="card bg-base-100 shadow-sm rounded-none max-w-full"
          >
            <div className="card-body p-1">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-base">New Redirection</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-ghost btn-square btn-sm"
                    onClick={() => setNewRedirectionId(null)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <RedirectionCard
                  onComplete={handleRedirectionComplete}
                  isNew={true}
                />
              </div>
            </div>
          </div>
        )}

        {redirections.map((redirection) => (
          <div
            key={redirection.id}
            className="card bg-base-100 shadow-sm rounded-none max-w-full"
          >
            <div className="card-body p-1">
              <div className="flex items-center gap-4">
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
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-sm flex flex-row gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedRedirectionId(
                        expandedRedirectionId === redirection.id
                          ? null
                          : redirection.id,
                      );
                    }}
                  >
                    <Dashicon icon="edit" />
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
                  <button
                    className="btn btn-error btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRedirection(redirection.id);
                    }}
                  >
                    <Dashicon icon="trash" />
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
                            : r,
                        ),
                      );
                      setExpandedRedirectionId(null);
                    }}
                    isNew={false}
                    initialData={redirection}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
