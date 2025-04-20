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
  // Track which redirection is currently being saved
  const [savingRedirectionId, setSavingRedirectionId] = useState<string | null>(null);
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

  // --- CRUD Operations ---

  const handleCreateRedirection = async (newRedirectionData: Redirection) => {
    const tempId = newRedirectionData.id; // Keep track of the temporary ID
    setSavingRedirectionId(tempId); // Indicate saving started for this new card
    setSaveMessage(null);
    try {
      // Remove temporary frontend ID before sending
      const { id, ...dataToSend } = newRedirectionData;
      const response = await apiFetch({
        path: "maki-geo/v1/redirections",
        method: "POST",
        data: dataToSend, // Send data without the temporary ID
      });

      if (response && response.success && response.redirection) {
        // Add the new redirection (with server-assigned ID) to the state
        setRedirections([...redirections, response.redirection]);
        setRedirections([...redirections, response.redirection]);
        setNewRedirectionId(null); // Close the "new" card
        setExpandedRedirectionId(null); // Ensure no card is expanded
        setSaveMessage({ text: "Redirection created!", type: "success" });
      } else {
        throw new Error(response.message || "Failed to create redirection.");
      }
    } catch (error: any) {
      console.error("Error creating redirection:", error);
      setSaveMessage({
        text: `Create failed: ${error.message || "Unknown error"}`,
        type: "error",
      });
      // Don't close the card on error
    } finally {
      setSavingRedirectionId(null); // Indicate saving finished
      setTimeout(() => setSaveMessage(null), 5000); // Auto-hide message after 5s
    }
  };

  const handleUpdateRedirection = async (updatedRedirectionData: Redirection) => {
    const idToUpdate = updatedRedirectionData.id;
    setSavingRedirectionId(idToUpdate); // Indicate saving started for this card
    setSaveMessage(null);

    try {
      const response = await apiFetch({
        path: `maki-geo/v1/redirections/${idToUpdate}`,
        method: "PUT",
        data: updatedRedirectionData,
      });

      if (response && response.success && response.redirection) {
        // Update the redirection in the local state
        const updatedList = redirections.map((r) =>
          r.id === idToUpdate ? response.redirection : r,
        );
        setRedirections(updatedList);
        setExpandedRedirectionId(null); // Close the editing card
        setRedirections(updatedList);
        setExpandedRedirectionId(null); // Close the editing card on success
        setSaveMessage({ text: "Redirection updated!", type: "success" });
      } else {
        throw new Error(response.message || "Failed to update redirection.");
      }
    } catch (error: any) {
      console.error("Error updating redirection:", error);
      setSaveMessage({
        text: `Update failed: ${error.message || "Unknown error"}`,
        type: "error",
      });
      // Don't close the card on error
    } finally {
      setSavingRedirectionId(null); // Indicate saving finished
      setTimeout(() => setSaveMessage(null), 5000); // Auto-hide message after 5s
    }
  };


  const handleDeleteRedirection = async (redirectionId: string) => {
    if (window.confirm("Are you sure you want to delete this redirection?")) {
      // Use savingRedirectionId to indicate activity during delete
      setSavingRedirectionId(redirectionId);
      setSaveMessage(null);
      try {
        const response = await apiFetch({
                path: `maki-geo/v1/redirections/${redirectionId}`,
                method: "DELETE",
            });

            if (response && response.success) {
                // Remove the redirection from local state
                const updatedRedirections = redirections.filter(
                    (redirection) => redirection.id !== redirectionId,
                );
                setRedirections(updatedRedirections);
                setSaveMessage({ text: "Redirection deleted!", type: "success" });
            } else {
                 throw new Error(response.message || "Failed to delete redirection.");
            }
        } catch (error: any) {
            console.error("Error deleting redirection:", error);
            setSaveMessage({
                text: `Delete failed: ${error.message || "Unknown error"}`,
                type: "error",
            });
        } finally {
            setSavingRedirectionId(null); // Indicate delete finished
            setTimeout(() => setSaveMessage(null), 5000); // Auto-hide message after 5s
        }
    }
  };

  // --- Render Logic ---

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
                  onComplete={handleCreateRedirection} // Use create handler
                  isNew={true}
                  // Pass saving state specific to this new card
                  isSaving={savingRedirectionId === newRedirectionId}
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
                  onComplete={handleUpdateRedirection} // Use update handler
                  isNew={false}
                  initialData={redirection}
                  // Pass saving state specific to this card
                  isSaving={savingRedirectionId === redirection.id}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
