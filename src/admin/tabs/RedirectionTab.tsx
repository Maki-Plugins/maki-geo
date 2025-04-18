import { useState, useEffect } from "@wordpress/element";
import { Redirection } from "../../types/types";
import { RedirectionCard } from "../components/RedirectionCard";
import { Dashicon } from "@wordpress/components";
import apiFetch from "@wordpress/api-fetch";
import { addQueryArgs } from "@wordpress/url";

declare const makiGeoData: {
  nonce: string;
  redirections: Redirection[];
};

export function RedirectionTab(): JSX.Element {
  const [expandedRedirectionId, setExpandedRedirectionId] = useState<
    string | null
  >(null);
  const [redirections, setRedirections] = useState<Redirection[]>([]);
  const [newRedirectionId, setNewRedirectionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Load redirections from WordPress data
  useEffect(() => {
    if (makiGeoData && makiGeoData.redirections) {
      setRedirections(makiGeoData.redirections);
    }
  }, []);

  // Save redirections to the database
  const saveRedirections = async (redirectionsToSave: Redirection[]) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await apiFetch({
        path: "maki-geo/v1/redirections",
        method: "POST",
        data: redirectionsToSave,
      });

      if (response && response.success) {
        setSaveMessage({
          text: "Redirections saved successfully!",
          type: "success",
        });
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSaveMessage(null);
        }, 3000);
      } else {
        setSaveMessage({
          text: response.message || "Failed to save redirections.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error saving redirections:", error);
      setSaveMessage({
        text: "An error occurred while saving redirections.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRedirectionComplete = (redirection: Redirection) => {
    const updatedRedirections = [
      ...redirections,
      { ...redirection, id: String(Date.now()) },
    ];
    setRedirections(updatedRedirections);
    setNewRedirectionId(null);
    saveRedirections(updatedRedirections);
  };

  const handleDeleteRedirection = (redirectionId: string) => {
    if (window.confirm("Are you sure you want to delete this redirection?")) {
      const updatedRedirections = redirections.filter(
        (redirection) => redirection.id !== redirectionId,
      );
      setRedirections(updatedRedirections);
      saveRedirections(updatedRedirections); // Re-enable save on delete
    }
  };

  return (
    <div className="p-5">
      <div className="mb-5 flex justify-between items-center">
        {saveMessage && (
          <div
            className={`alert ${
              saveMessage.type === "success" ? "alert-success" : "alert-error"
            } shadow-lg absolute top-4 right-4 w-auto max-w-md`}
          >
            <div>
              <Dashicon icon={saveMessage.type === "success" ? "yes" : "no"} />
              <span>{saveMessage.text}</span>
            </div>
          </div>
        )}
        <div>
          <h2 className="text-2xl mb-2 text-secondary">Geo redirection</h2>
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
          <Dashicon icon="plus" /> Add new redirection
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
                  <h3 className="font-semibold text-base">New redirection</h3>
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
                    data-testid="mgeo_edit_redirection"
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
                    data-testid="mgeo_delete_redirection"
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

              {/* Always render the container, but hide it conditionally */}
              <div
                className={`mt-4 pt-4 border-t ${expandedRedirectionId === redirection.id ? "" : "hidden"}`}
              >
                {/* Always render RedirectionCard when its container is visible to preserve state */}
                <RedirectionCard
                  onComplete={(updatedRedirection) => {
                    const updatedRedirections = redirections.map((r) =>
                      r.id === redirection.id
                        ? { ...updatedRedirection, id: redirection.id }
                        : r,
                    );
                    setRedirections(updatedRedirections);
                    setExpandedRedirectionId(null);
                    // saveRedirections(updatedRedirections); // Removed auto-save on edit complete
                  }}
                  isNew={false}
                  initialData={redirection}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
