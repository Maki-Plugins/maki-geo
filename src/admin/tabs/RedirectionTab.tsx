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
  const [savingRedirectionId, setSavingRedirectionId] = useState<string | null>(
    null,
  );
  // Removed saveMessage state

  // Load redirections from WordPress data
  useEffect(() => {
    if (makiGeoData && makiGeoData.redirections) {
      setRedirections(makiGeoData.redirections);
    }
  }, []);

  // --- CRUD Operations ---

  // Modified to return the promise
  const handleCreateRedirection = (
    newRedirectionData: Redirection,
  ): Promise<any> => {
    const tempId = newRedirectionData.id; // Keep track of the temporary ID
    setSavingRedirectionId(tempId); // Indicate saving started for this new card
    // Removed setSaveMessage(null);

    // Remove temporary frontend ID before sending
    const { id, ...dataToSend } = newRedirectionData;

    // Return the promise from apiFetch
    return apiFetch({
        path: "maki-geo/v1/redirections",
        method: "POST",
        data: dataToSend, // Send data without the temporary ID
      });

      if (response && response.success && response.redirection) {
        // Add the new redirection (with server-assigned ID) to the state
        setRedirections([...redirections, response.redirection]);
      path: "maki-geo/v1/redirections",
      method: "POST",
      data: dataToSend, // Send data without the temporary ID
    })
      .then((response: any) => {
        if (response && response.success && response.redirection) {
          // Add the new redirection (with server-assigned ID) to the state
          setRedirections([...redirections, response.redirection]);
          setNewRedirectionId(null); // Close the "new" card
          // Removed setExpandedRedirectionId(null);
          // Removed setSaveMessage
          return response; // Resolve the promise with the response
        } else {
          throw new Error(response.message || "Failed to create redirection.");
        }
      })
      .catch((error: any) => {
        console.error("Error creating redirection:", error);
        // Removed setSaveMessage
        // Don't close the card on error
        throw error; // Re-throw the error for the caller (RedirectionCard)
      })
      .finally(() => {
        setSavingRedirectionId(null); // Indicate saving finished
        // Removed setTimeout for saveMessage
      });
  };

  // Modified to return the promise
  const handleUpdateRedirection = (
    updatedRedirectionData: Redirection,
  ): Promise<any> => {
    const idToUpdate = updatedRedirectionData.id;
    setSavingRedirectionId(idToUpdate); // Indicate saving started for this card
    // Removed setSaveMessage(null);

    // Return the promise from apiFetch
    return apiFetch<{
      success: boolean;
      redirection: Redirection;
      message?: string; // Add message property for potential errors
    }>({
      path: `maki-geo/v1/redirections/${idToUpdate}`,
      method: "PUT",
      data: updatedRedirectionData,
    })
      .then((response) => {
        if (response && response.success && response.redirection) {
          // Update the redirection in the local state
          const updatedList = redirections.map((r) =>
            r.id === idToUpdate ? response.redirection : r,
          );
          setRedirections(updatedList);
          // Removed setExpandedRedirectionId(null);
          // Removed setSaveMessage
          return response; // Resolve the promise with the response
        } else {
          throw new Error(response.message || "Failed to update redirection.");
        }
      })
      .catch((error: any) => {
        console.error("Error updating redirection:", error);
        // Removed setSaveMessage
        // Don't close the card on error
        throw error; // Re-throw the error for the caller (RedirectionCard)
      })
      .finally(() => {
        setSavingRedirectionId(null); // Indicate saving finished
        // Removed setTimeout for saveMessage
      });
  };

  const handleDeleteRedirection = async (redirectionId: string) => {
    if (window.confirm("Are you sure you want to delete this redirection?")) {
      // Use savingRedirectionId to indicate activity during delete
      setSavingRedirectionId(redirectionId);
      // Removed setSaveMessage(null);
      try {
        const response: any = await apiFetch({
          path: `maki-geo/v1/redirections/${redirectionId}`,
          method: "DELETE",
        });

        if (response && response.success) {
          // Remove the redirection from local state
          const updatedRedirections = redirections.filter(
            (redirection) => redirection.id !== redirectionId,
          );
          setRedirections(updatedRedirections);
          // Removed setSaveMessage
          // Optionally, show a temporary success message for delete if needed,
          // but the card disappears anyway.
        } else {
          throw new Error(response.message || "Failed to delete redirection.");
        }
      } catch (error: any) {
        console.error("Error deleting redirection:", error);
        // Removed setSaveMessage
        // Show error differently if needed, maybe an alert?
        alert(`Delete failed: ${error.message || "Unknown error"}`);
      } finally {
        setSavingRedirectionId(null); // Indicate delete finished
        // Removed setTimeout for saveMessage
      }
    }
  };

  // --- Render Logic ---

  return (
    <div className="p-5">
      {/* Removed toast message container */}
      <div className="mb-5 flex justify-between items-center">
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
            className="card bg-base-100 shadow-sm rounded-none max-w-full pt-[1em]"
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
                  <h3 className="font-semibold text-base">
                    {redirection.name}
                  </h3>
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
                className={`mt-2 pt-4 border-t ${expandedRedirectionId === redirection.id ? "" : "hidden"}`}
              >
                {/* Always render RedirectionCard when its container is visible to preserve state */}
                <RedirectionCard
                  onComplete={handleUpdateRedirection} // Use update handler
                  isNew={false}
                  initialData={redirection}
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
