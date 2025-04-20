import { useState, useEffect } from "@wordpress/element";
import { useForm, useFieldArray, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GeoConditionEditor } from "../../components/geo-condition-editor/geo-condition-editor";
import {
  ExclusionType,
  GeoCondition,
  PageExclusion,
  Redirection,
  RedirectionLocation,
  RedirectMapping,
} from "../../types/types";
import {
  redirectionSchema,
  RedirectionFormData,
} from "./redirection-schema";
import { Dashicon } from "@wordpress/components";
import Toggle from "./Toggle";
import HelpHover from "./HelpHover";

// Types (WizardStep removed)

interface RedirectionCardProps {
  onComplete: (redirection: RedirectionFormData) => void; // Use validated form data type
  isNew?: boolean;
  initialData?: Redirection; // Keep initialData type as is from WP
}

// Helper to create default location structure matching the schema
function createDefaultLocation(): RedirectionLocation {
  return {
    id: `loc_${Date.now()}`, // RHF useFieldArray will manage its own IDs later
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

export function RedirectionCard({
  onComplete,
  isNew = true,
  initialData,
}: RedirectionCardProps): JSX.Element {
  // --- React Hook Form Setup ---
  const methods = useForm<RedirectionFormData>({
    resolver: zodResolver(redirectionSchema),
    defaultValues: initialData
      ? { ...initialData } // Spread initial data if editing
      : { // Default values for a new redirection
          id: `new_${Date.now()}`, // Temporary ID for new
          name: "",
          isEnabled: true,
          locations: [createDefaultLocation()],
        },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    control, // Needed for useFieldArray and Controller
    watch,   // Needed for conditional rendering later
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

  // --- Functions ---
  // Default location structure for appending new locations
  function createDefaultLocation(): Omit<RedirectionLocation, 'id'> { // Omit id, RHF handles it
    return {
      // id: `loc_${Date.now()}`, // RHF provides id
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
    const newLocation = createDefaultLocation();
    append(newLocation);
    // Optionally expand the newly added location - need RHF's ID after append
    // This is slightly more complex, might need useEffect or watch
    // For now, let's not auto-expand. User can click.
    // const newIndex = fields.length; // Index before append
    // setTimeout(() => { // Allow RHF to update fields
    //   const newFieldId = fields[newIndex]?.id;
    //   if (newFieldId) setExpandedLocationId(newFieldId);
    // }, 0);
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

  // Default structures for appending new nested items
  function createDefaultMapping(): Omit<RedirectMapping, 'id'> {
    return { fromUrl: "", toUrl: "" };
  }

  function createDefaultExclusion(): Omit<PageExclusion, 'id'> {
    return { value: "", type: "url_equals" };
  }


  // --- Form Submission ---
  const onSubmit = (data: RedirectionFormData) => {
    console.log("Form Data Submitted:", data); // For debugging
    // Call the original onComplete with the validated data
    onComplete(data);
  }

  const onInvalid = (errors: any) => {
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

  // Render function now uses RHF's field and index
  function renderLocationCard(field: RedirectionLocation & { id: string }, index: number) {
    const isExpanded = expandedLocationId === field.id; // Use RHF field id
    const locationData = watch(`locations.${index}`); // Watch current location data for display/logic

    // Get specific errors for this location index
    const locationErrors = errors.locations?.[index];

    // --- Nested Field Arrays Setup ---
    const {
      fields: mappingFields,
      append: appendMapping,
      remove: removeMapping,
    } = useFieldArray({
      control,
      name: `locations.${index}.redirectMappings`,
    });

    const {
      fields: exclusionFields,
      append: appendExclusion,
      remove: removeExclusion,
    } = useFieldArray({
      control,
      name: `locations.${index}.exclusions`,
    });

    return (
      <div
        key={field.id} // Use RHF field id as key
        className="card border-neutral shadow-sm rounded-none max-w-full mb-4 mt-0"
      >
        <div className="card-body p-1">
          <div
            className="flex items-center gap-4 cursor-pointer p-4" // Added padding
            onClick={() =>
              setExpandedLocationId(isExpanded ? null : field.id) // Use RHF field id
            }
          >
            <div className="flex-1">
              <h3 className="font-bold text-base">
                {/* Pass watched data to title function */}
                {getLocationTitle(locationData, index)}
              </h3>
              {/* Display top-level location error */}
              {locationErrors && typeof locationErrors === 'object' && !locationErrors.conditions && !locationErrors.redirectUrl && !locationErrors.redirectMappings && (
                 <p className="text-error text-xs mt-1">{locationErrors.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost btn-square btn-sm"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent card click
                  setExpandedLocationId(isExpanded ? null : field.id); // Use RHF field id
                }}
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
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

          {isExpanded && (
            <div className="mt-4 pt-4 border-t">
              <div className="space-y-16">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center">
                      Location Conditions
                      <HelpHover text="Set conditions based on visitor's location data such as country, region, or city. Multiple conditions can be combined with AND/OR operators." />
                    </span>
                  </label>
                  {/* Use Controller for GeoConditionEditor */}
                  <Controller
                    name={`locations.${index}`} // Control the whole location object to get conditions/operator
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <GeoConditionEditor
                        conditions={value.conditions} // Pass conditions from RHF state
                        operator={value.operator}     // Pass operator from RHF state
                        onChange={(newConditions, newOperator) => {
                          // Update the entire location object in RHF state
                          onChange({
                            ...value, // Keep other location fields
                            conditions: newConditions,
                            operator: newOperator,
                          });
                        }}
                      />
                    )}
                  />
                  {/* Display errors for conditions or operator */}
                   {(locationErrors?.conditions || locationErrors?.operator) && (
                     <p className="text-error text-xs mt-1">
                       {locationErrors.conditions?.message || locationErrors.operator?.message || 'Error in conditions'}
                     </p>
                   )}
                </div>
                <div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold flex items-center">
                        Page Targeting
                        <HelpHover text="Choose whether to redirect all pages or only specific URLs. 'All pages' applies the redirection site-wide, while 'Specific pages' allows URL-by-URL mapping." />
                      </span>
                    </label>
                    <div className="flex gap-4">
                      <label className="label cursor-pointer">
                        <input
                          type="radio"
                          // name={`pageTargeting-${field.id}`} // RHF handles name grouping
                          className="radio radio-primary"
                          value="all" // Set value for radio group
                          {...register(`locations.${index}.pageTargetingType`)} // Register with RHF
                        />
                        <span className="label-text ml-1">All pages</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="radio"
                          // name={`pageTargeting-${field.id}`} // RHF handles name grouping
                          className="radio radio-primary"
                          value="specific" // Set value for radio group
                          {...register(`locations.${index}.pageTargetingType`)} // Register with RHF
                        />
                        <span className="label-text ml-1">Specific pages</span>
                      </label>
                      {locationErrors?.pageTargetingType && (
                        <p className="text-error text-xs mt-1">{locationErrors.pageTargetingType.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Conditional rendering based on watched value */}
                  {watch(`locations.${index}.pageTargetingType`) === "all" ? (
                    <div className="form-control">
                      <label className="label" htmlFor={`locations.${index}.redirectUrl`}>
                        <span className="label-text font-semibold flex items-center">
                          Redirect URL
                          <HelpHover text="The destination URL where visitors will be redirected to. Use a full URL including https://." />
                        </span>
                      </label>
                      <input
                        id={`locations.${index}.redirectUrl`}
                        type="text"
                        {...register(`locations.${index}.redirectUrl`)} // Register with RHF
                        placeholder="https://example.com/target-path/"
                        className={`input input-bordered input-sm w-full ${
                          locationErrors?.redirectUrl ? "input-error" : ""
                        }`}
                      />
                      {locationErrors?.redirectUrl && (
                        <p className="text-error text-xs mt-1">{locationErrors.redirectUrl.message}</p>
                      )}
                    </div>
                  ) : (
                    // TODO: Integrate Redirect Mappings with nested useFieldArray in Step 3
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold flex items-center">
                          Redirect URLs
                          <HelpHover text="Map specific source URLs to destination URLs. Each mapping defines which page redirects to where." />
                        </span>
                      </label>
                      <div className="space-y-2">
                        {/* Use mappingFields from nested useFieldArray */}
                        {mappingFields.map((mappingField, mapIndex) => (
                          <div
                            key={mappingField.id} // Use RHF field id
                            className="join flex items-center"
                          >
                            <input
                              type="text"
                              {...register(`locations.${index}.redirectMappings.${mapIndex}.fromUrl`)}
                              placeholder="From URL Path (e.g., /source)"
                              className={`input input-bordered input-sm w-full join-item ${
                                locationErrors?.redirectMappings?.[mapIndex]?.fromUrl ? "input-error" : ""
                              }`}
                            />
                            <span className="join-item mx-2">→</span>
                            <input
                              type="text"
                              {...register(`locations.${index}.redirectMappings.${mapIndex}.toUrl`)}
                              placeholder="To URL (e.g., https://site.com/dest)"
                              className={`input input-bordered input-sm w-full join-item ${
                                locationErrors?.redirectMappings?.[mapIndex]?.toUrl ? "input-error" : ""
                              }`}
                            />
                            <button
                              type="button" // Prevent form submission
                              className="btn btn-sm btn-error btn-ghost join-item"
                              onClick={() => removeMapping(mapIndex)} // Use remove from useFieldArray
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                         {/* Display mapping-level errors */}
                         {locationErrors?.redirectMappings?.map((mapError, mapIndex) => (
                            mapError && !mapError.root && ( // Check it's not a root error message
                              <div key={`mapErr-${mapIndex}`} className="text-error text-xs mt-1 ml-1">
                                {mapError.fromUrl && <p>From URL: {mapError.fromUrl.message}</p>}
                                {mapError.toUrl && <p>To URL: {mapError.toUrl.message}</p>}
                              </div>
                            )
                         ))}
                         {/* Display array-level error for mappings */}
                         {locationErrors?.redirectMappings?.root && (
                            <p className="text-error text-xs mt-1">{locationErrors.redirectMappings.root.message}</p>
                         )}
                        <button
                          type="button" // Prevent form submission
                          className="btn btn-sm btn-accent btn-outline"
                          onClick={() => appendMapping(createDefaultMapping())} // Use append from useFieldArray
                        >
                          <Dashicon icon="plus" /> Add URL Mapping
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* TODO: Integrate Exclusions with nested useFieldArray in Step 3 */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center">
                      Page Exclusions
                      <HelpHover text="Define exceptions to your redirection rules. Pages matching these exclusions will not be redirected, even if they match other conditions." />
                    </span>
                  </label>
                  <div className="space-y-2">
                     {/* Use exclusionFields from nested useFieldArray */}
                    {exclusionFields.map((exclusionField, exclIndex) => (
                      <div
                        key={exclusionField.id} // Use RHF field id
                        className="join flex items-center"
                      >
                        <select
                          {...register(`locations.${index}.exclusions.${exclIndex}.type`)}
                          className={`select select-bordered select-sm join-item ${
                            locationErrors?.exclusions?.[exclIndex]?.type ? "select-error" : ""
                          }`}
                        >
                          <option value="url_equals">URL Path equals</option>
                          <option value="url_contains">URL Path contains</option>
                          <option value="query_contains">Query contains</option>
                          <option value="hash_contains">Hash contains</option>
                        </select>
                        <input
                          type="text"
                          {...register(`locations.${index}.exclusions.${exclIndex}.value`)}
                          placeholder="Value to exclude"
                          className={`input input-bordered input-sm w-full join-item ${
                            locationErrors?.exclusions?.[exclIndex]?.value ? "input-error" : ""
                          }`}
                        />
                        <button
                          type="button" // Prevent form submission
                          className="btn btn-sm btn-error btn-ghost join-item"
                          onClick={() => removeExclusion(exclIndex)} // Use remove from useFieldArray
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {/* Display exclusion-level errors */}
                    {locationErrors?.exclusions?.map((exclError, exclIndex) => (
                      exclError && !exclError.root && ( // Check it's not a root error message
                        <div key={`exclErr-${exclIndex}`} className="text-error text-xs mt-1 ml-1">
                          {exclError.type && <p>Type: {exclError.type.message}</p>}
                          {exclError.value && <p>Value: {exclError.value.message}</p>}
                        </div>
                      )
                    ))}
                     {/* Display array-level error for exclusions */}
                     {locationErrors?.exclusions?.root && (
                        <p className="text-error text-xs mt-1">{locationErrors.exclusions.root.message}</p>
                     )}
                    <button
                      type="button" // Prevent form submission
                      className="btn btn-sm btn-accent btn-outline"
                      onClick={() => appendExclusion(createDefaultExclusion())} // Use append from useFieldArray
                    >
                      <Dashicon icon="plus" /> Add Exclusion
                    </button>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center">
                      Additional Options
                      <HelpHover text="Configure how URL paths and query parameters are handled during redirection." />
                    </span>
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        Pass page path to redirect URLs
                        <HelpHover text="When enabled, the current page path (e.g., /about-us/) will be appended to the destination URL. Only applies when 'Page Targeting' is 'All pages'." />
                      </span>
                      {/* Use Controller for Toggle */}
                      <Controller
                        name={`locations.${index}.passPath`}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <Toggle
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)} // Pass boolean value
                          />
                        )}
                      />
                      {locationErrors?.passPath && (
                        <p className="text-error text-xs mt-1">{locationErrors.passPath.message}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        Pass query string to redirect URLs
                        <HelpHover text="When enabled, query parameters from the current URL (e.g., ?utm_source=google) will be preserved and added to the destination URL." />
                      </span>
                       {/* Use Controller for Toggle */}
                       <Controller
                        name={`locations.${index}.passQuery`}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <Toggle
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)} // Pass boolean value
                          />
                        )}
                      />
                      {locationErrors?.passQuery && (
                        <p className="text-error text-xs mt-1">{locationErrors.passQuery.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button" // Prevent form submission
                    className="btn btn-sm btn-error btn-outline"
                    onClick={() => deleteLocation(index)} // Use index for remove
                    disabled={fields.length <= 1} // Disable based on RHF fields length
                  >
                    Delete Location
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Render Logic ---
  // No longer need separate render steps (settings/review)
  return (
    <FormProvider {...methods}>
      {/* Pass the onInvalid handler to handleSubmit, clear message on valid submit */}
      <form onSubmit={handleSubmit(() => { setFormErrorMessage(null); onSubmit(getValues()); }, onInvalid)} className="space-y-6">
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
                <p className="text-error text-xs mt-1">{errors.isEnabled.message}</p>
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
            {/* Map over fields from useFieldArray */}
            {fields.map((field, index) => renderLocationCard(field as RedirectionLocation & { id: string }, index))}
            <button
              type="button" // Prevent form submission
              className="btn btn-sm btn-accent btn-outline"
              onClick={addLocation} // Use the new addLocation function
            >
              <Dashicon icon="plus" /> Add Location
            </button>
            {/* Display top-level array error */}
            {errors.locations && !Array.isArray(errors.locations) && (
               <p className="text-error text-xs mt-1">{errors.locations.message}</p>
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
          {formErrorMessage && !methods.formState.isValid && methods.formState.isSubmitted && (
            <p className="text-error text-sm">{formErrorMessage}</p>
          )}
          <button type="submit" className="btn btn-primary">
            {isNew ? "Create Redirection" : "Update Redirection"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
