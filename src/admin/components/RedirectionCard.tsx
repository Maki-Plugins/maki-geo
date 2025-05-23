import { useState, useEffect } from "@wordpress/element";
import {
  useForm,
  useFieldArray,
  FormProvider,
  Controller,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirection, RedirectionLocation } from "../../types/types";
import { redirectionSchema, RedirectionFormData } from "./redirection-schema";
import { Dashicon } from "@wordpress/components";
import Toggle from "./Toggle";
import HelpHover from "./HelpHover";
import { LocationCard } from "./LocationCard"; // Import the new component

interface RedirectionCardProps {
  // Updated prop type to expect a Promise
  onComplete: (redirection: RedirectionFormData) => Promise<any>;
  isNew?: boolean;
  initialData?: Redirection; // Keep initialData type as is from WP
  isSaving: boolean; // Add prop to indicate saving state
}

// Helper function to generate unique IDs
function generateUniqueId(prefix = "loc_"): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function RedirectionCard({
  onComplete,
  isNew = true,
  initialData,
  isSaving, // Destructure the new prop
}: RedirectionCardProps): JSX.Element {
  // --- React Hook Form Setup ---
  const methods = useForm<RedirectionFormData>({
    resolver: zodResolver(redirectionSchema),
    defaultValues: initialData
      ? { ...initialData } // Spread initial data if editing
      : {
          // Default values for a new redirection
          id: `new_${Date.now()}`, // Temporary ID for new redirection itself
          name: "",
          isEnabled: true,
          // Ensure the first default location also gets a unique ID
          locations: [
            {
              id: generateUniqueId(), // Generate ID for the first location
              conditions: [{ type: "country", value: "", operator: "is" }],
              operator: "OR",
              pageTargetingType: "all",
              redirectUrl: "",
              redirectMappings: [],
              exclusions: [],
              passPath: true,
              passQuery: true,
            },
          ],
        },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    control, // Needed for useFieldArray and Controller
    getValues, // Useful for debugging or complex logic if needed
  } = methods;

  // --- Field Array for Locations ---
  const { fields, append, remove } = useFieldArray({
    control,
    name: "locations",
  });

  // --- State for UI ---
  // Use RHF's field.id for expansion state
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(
    fields[0]?.id || null, // Use RHF's field id
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null); // State for general form error
  // Add local state for the save message within the card
  const [cardSaveMessage, setCardSaveMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // --- Effects ---
  // Effect to clear the save message after a delay
  useEffect(() => {
    let timerId: number | undefined;
    if (cardSaveMessage) {
      timerId = window.setTimeout(() => {
        setCardSaveMessage(null);
      }, 5000); // 5 seconds
    }
    // Cleanup function to clear the timeout if the component unmounts
    // or if cardSaveMessage changes again before the timeout finishes
    return () => {
      if (timerId) {
        window.clearTimeout(timerId);
      }
    };
  }, [cardSaveMessage]); // Re-run effect when cardSaveMessage changes

  // --- Functions ---
  // Default location structure for appending new locations
  // This function is now used by the 'Add Location' button
  function createDefaultLocationForAppend(): RedirectionLocation {
    return {
      id: generateUniqueId(), // Generate a unique ID when appending
      conditions: [{ type: "country", value: "", operator: "is" }],
      operator: "OR",
      pageTargetingType: "all",
      redirectUrl: "",
      redirectMappings: [],
      exclusions: [],
      passPath: true,
      passQuery: true,
    };
  }

  // --- Functions using useFieldArray ---
  function addLocation() {
    const newLocation = createDefaultLocationForAppend(); // Use the correct function
    append(newLocation);
    // Optionally expand the newly added location - use the generated ID
    // This is slightly more complex, might need useEffect or watch
    // For now, let's not auto-expand. User can click.
  }

  function deleteLocation(index: number) {
    if (fields.length <= 1) {
      alert("You must have at least one location."); // Or handle via validation
      return; // Don't delete the last location
    }
    // Check if the deleted item was the expanded one
    const fieldIdToDelete = fields[index]?.id;
    if (expandedLocationId === fieldIdToDelete) {
      setExpandedLocationId(null); // Collapse if deleting expanded item
    }
    remove(index);
  }

  // --- Nested Field Array Functions (will be called inside renderLocationCard) ---

  // --- Form Submission ---
  // Modified onSubmit to handle the promise from onComplete
  const onSubmit = (data: RedirectionFormData) => {
    setCardSaveMessage(null); // Clear previous message
    setFormErrorMessage(null); // Clear validation error message
    console.log("Form Data Submitted:", data); // For debugging

    // Call onComplete and handle the returned promise
    onComplete(data)
      .then((_response) => {
        // Determine success message based on context (create/update)
        const successText = isNew
          ? "Redirection created successfully!"
          : "Redirection saved successfully!";
        setCardSaveMessage({ text: successText, type: "success" });
        // Optionally reset form if needed, e.g., for 'new' card, but parent handles closing it.
        // if (isNew) methods.reset(); // Reset form after successful creation if desired
      })
      .catch((error) => {
        console.error("Save operation failed:", error);
        setCardSaveMessage({
          text: `Save failed: ${error.message || "Unknown error"}`,
          type: "error",
        });
      });
  };

  const onInvalid = (errors: any) => {
    setCardSaveMessage(null); // Clear save message if validation fails
    console.error("Form validation failed:", errors);
    setFormErrorMessage("Please correct the errors highlighted above.");
    // Focus the first field with an error
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      methods.setFocus(firstErrorField as any);
    }
  };

  function getLocationTitle(
    location: RedirectionLocation,
    index: number,
  ): string {
    // Get a summary of the conditions
    const conditionSummary =
      location.conditions.length > 0
        ? location.conditions.map((c) => `${c.value}`).join(", ")
        : "Any location";

    // Get a summary of the page targeting
    let pageSummary = "All pages";
    if (location.pageTargetingType === "specific") {
      const count = location.redirectMappings.length;
      pageSummary =
        count > 0
          ? `${count} specific page${count > 1 ? "s" : ""}`
          : "No pages";
    }

    // Combine the summaries
    let title = conditionSummary;
    if (location.conditions.length > 2) {
      const firstTwo = location.conditions
        .slice(0, 2)
        .map((c) => c.value)
        .join(", ");
      title = `${firstTwo} + ${location.conditions.length - 2} more`;
    }

    return `Location ${index + 1}: ${title} - ${pageSummary}`;
  }

  // --- Render Logic ---
  // No longer need separate render steps (settings/review)
  // renderLocationCard function and nested hooks are removed.
  // Location rendering is now handled by the LocationCard component.
  return (
    <FormProvider {...methods}>
      {/* Pass the onInvalid handler to handleSubmit, clear message on valid submit */}
      <form
        onSubmit={handleSubmit(() => {
          setFormErrorMessage(null);
          onSubmit(getValues());
        }, onInvalid)}
        className="space-y-6"
      >
        {/* Top Level Fields */}
        <div className="grid grid-cols-1 gap-4">
          <div className="form-control">
            <label className="label" htmlFor="mgeo_redirect_name">
              <span className="label-text font-semibold flex items-center">
                Geo Redirect Name
                <HelpHover text="A descriptive name to identify this redirection rule in the admin panel." />
              </span>
            </label>
            <input
              id="mgeo_redirect_name"
              type="text"
              {...register("name")} // Register the name field
              placeholder="US and CA to English site"
              className={`input input-bordered input-sm w-full ${
                errors.name ? "input-error" : ""
              }`}
            />
            {errors.name && (
              <p className="text-error text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold flex items-center">
                Active
                <HelpHover text="Toggle to enable or disable this redirection rule without deleting it." />
              </span>
            </label>
            <div className="flex items-center gap-2">
              {/* Use Controller for Toggle */}
              <Controller
                name="isEnabled"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <Toggle
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)} // Pass boolean value
                  />
                )}
              />
              {errors.isEnabled && (
                <p className="text-error text-xs mt-1">
                  {errors.isEnabled.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Locations Section (using manual state for now) */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold flex items-center">
              Redirect Locations
              <HelpHover text="Define different redirection rules based on visitor location. Add multiple locations for different geo-targeting scenarios." />
            </span>
          </label>
          <div className="space-y-2">
            {/* Map over fields from useFieldArray and render LocationCard */}
            {fields.map((field, index) => (
              <LocationCard
                key={field.id} // RHF field id
                locationIndex={index}
                field={field as RedirectionLocation & { id: string }}
                isExpanded={expandedLocationId === field.id}
                onToggleExpand={() =>
                  setExpandedLocationId(
                    expandedLocationId === field.id ? null : field.id,
                  )
                }
                onDelete={() => deleteLocation(index)}
                getLocationTitle={getLocationTitle}
                isLastLocation={fields.length <= 1}
              />
            ))}
            <button
              type="button" // Prevent form submission
              className="btn btn-sm btn-accent btn-outline"
              onClick={addLocation} // Use the new addLocation function
            >
              <Dashicon icon="plus" /> Add Location
            </button>
            {/* Display top-level array error */}
            {errors.locations && !Array.isArray(errors.locations) && (
              <p className="text-error text-xs mt-1">
                {errors.locations.message}
              </p>
            )}
          </div>
        </div>

        {/* Advanced Settings (Placeholder) */}
        <div className="collapse collapse-arrow bg-base-200">
          <input
            type="checkbox"
            checked={isAdvancedOpen}
            onChange={() => setIsAdvancedOpen(!isAdvancedOpen)}
          />
          <div className="collapse-title font-medium flex items-center">
            Advanced Settings
            <HelpHover text="Additional configuration options for advanced redirection scenarios." />
          </div>
          <div className="collapse-content">
            <p className="text-gray-500">
              Advanced settings will be added in a future update.
            </p>
          </div>
        </div>

        {/* Submit Button & Error Message */}
        <div className="flex flex-col items-end gap-2 mt-6">
          {/* Display general form error message */}
          {formErrorMessage &&
            !methods.formState.isValid &&
            methods.formState.isSubmitted && (
              <p className="text-error text-sm">{formErrorMessage}</p>
            )}
          <button
            type="submit"
            className="btn btn-primary" // Remove loading class from button itself
            disabled={isSaving} // Disable button when saving
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner"></span>Saving...
              </>
            ) : isNew ? (
              "Create Redirection"
            ) : (
              "Update Redirection"
            )}
          </button>
          {/* Display local card save message */}
          {cardSaveMessage && (
            <p
              className={`text-sm mt-1 ${
                cardSaveMessage.type === "success"
                  ? "text-green-600"
                  : "text-error"
              }`}
            >
              {cardSaveMessage.text}
            </p>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
