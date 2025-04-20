import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Dashicon } from "@wordpress/components";
import { GeoConditionEditor } from "../../components/geo-condition-editor/geo-condition-editor";
import { RedirectionLocation } from "../../types/types";
import Toggle from "./Toggle";
import HelpHover from "./HelpHover";

// Helper function (can be moved to a utils file later)
function generateUniqueId(prefix = "loc_"): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface LocationCardProps {
  locationIndex: number;
  field: RedirectionLocation & { id: string }; // Field object from useFieldArray
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  getLocationTitle: (location: RedirectionLocation, index: number) => string;
  isLastLocation: boolean;
}

export function LocationCard({
  locationIndex,
  field,
  isExpanded,
  onToggleExpand,
  onDelete,
  getLocationTitle,
  isLastLocation,
}: LocationCardProps): JSX.Element {
  // Access form methods and state from the FormProvider context in RedirectionCard
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<RedirectionFormData>();

  // Get specific errors for this location index
  const locationErrors = errors.locations?.[locationIndex];
  const locationData = watch(`locations.${locationIndex}`); // Watch current location data for display/logic

  // --- Nested Field Arrays Setup (Moved Here) ---
  const {
    fields: mappingFields,
    append: appendMapping,
    remove: removeMapping,
  } = useFieldArray({
    control,
    name: `locations.${locationIndex}.redirectMappings`,
  });

  const {
    fields: exclusionFields,
    append: appendExclusion,
    remove: removeExclusion,
  } = useFieldArray({
    control,
    name: `locations.${locationIndex}.exclusions`,
  });

  return (
    <div
      key={field.id} // Use RHF field id as key
      className="card border-neutral shadow-sm rounded-none max-w-full mb-4 mt-0"
    >
      <div className="card-body p-1">
        {/* Card Header */}
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={onToggleExpand}
        >
          <div className="flex-1">
            <h3 className="font-semibold">
              <Dashicon icon="location" />{" "}
              {/* Pass watched data to title function */}
              {getLocationTitle(locationData, locationIndex)}
            </h3>
            {/* Display top-level location error (if any, beyond specific fields) */}
            {locationErrors &&
              typeof locationErrors === "object" &&
              !locationErrors.conditions &&
              !locationErrors.redirectUrl &&
              !locationErrors.redirectMappings &&
              !locationErrors.exclusions && (
                <p className="text-error text-xs mt-1">
                  {locationErrors.message || locationErrors.root?.message}
                </p>
              )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-square btn-sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent card click triggering toggle twice
                onToggleExpand();
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

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 border-t">
            {" "}
            {/* Add padding around content */}
            <div className="space-y-6">
              {" "}
              {/* Reduced spacing */}
              {/* Location Conditions */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold flex items-center">
                    Location Conditions
                    <HelpHover text="Set conditions based on visitor's location data such as country, region, or city. Multiple conditions can be combined with AND/OR operators." />
                  </span>
                </label>
                <Controller
                  name={`locations.${locationIndex}`} // Control the whole location object
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <GeoConditionEditor
                      conditions={value.conditions}
                      operator={value.operator}
                      onChange={(newConditions, newOperator) => {
                        onChange({
                          ...value,
                          conditions: newConditions,
                          operator: newOperator,
                        });
                      }}
                    />
                  )}
                />
                {(locationErrors?.conditions || locationErrors?.operator) && (
                  <p className="text-error text-xs mt-1">
                    {locationErrors.conditions?.root?.message || // RHF nests array errors under root
                      locationErrors.operator?.message ||
                      "Error in conditions"}
                  </p>
                )}
              </div>
              {/* Page Targeting & Redirect URL/Mappings */}
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
                        className="radio radio-primary radio-sm" // Smaller radio
                        value="all"
                        {...register(
                          `locations.${locationIndex}.pageTargetingType`,
                        )}
                      />
                      <span className="label-text ml-1">All pages</span>
                    </label>
                    <label className="label cursor-pointer">
                      <input
                        type="radio"
                        className="radio radio-primary radio-sm" // Smaller radio
                        value="specific"
                        {...register(
                          `locations.${locationIndex}.pageTargetingType`,
                        )}
                      />
                      <span className="label-text ml-1">Specific pages</span>
                    </label>
                    {locationErrors?.pageTargetingType && (
                      <p className="text-error text-xs mt-1">
                        {locationErrors.pageTargetingType.message}
                      </p>
                    )}
                  </div>
                </div>

                {watch(`locations.${locationIndex}.pageTargetingType`) ===
                "all" ? (
                  <div className="form-control mt-4">
                    <label
                      className="label py-0"
                      htmlFor={`locations.${locationIndex}.redirectUrl`}
                    >
                      <span className="label-text font-semibold flex items-center">
                        Redirect URL
                        <HelpHover text="The destination URL where visitors will be redirected to. Use a full URL including https://." />
                      </span>
                    </label>
                    <input
                      id={`locations.${locationIndex}.redirectUrl`}
                      type="text"
                      {...register(`locations.${locationIndex}.redirectUrl`)}
                      placeholder="https://example.com/target-path/"
                      className={`input input-bordered input-sm w-full ${
                        locationErrors?.redirectUrl ? "input-error" : ""
                      }`}
                    />
                    {locationErrors?.redirectUrl && (
                      <p className="text-error text-xs mt-1">
                        {locationErrors.redirectUrl.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="form-control mt-4">
                    <label className="label py-0">
                      <span className="label-text font-semibold flex items-center">
                        Redirect URLs
                        <HelpHover text="Map specific source URLs to destination URLs. Each mapping defines which page redirects to where." />
                      </span>
                    </label>
                    <div className="space-y-2">
                      {mappingFields.map((mappingField, mapIndex) => (
                        <div
                          key={mappingField.id}
                          className="join flex items-center"
                        >
                          <input
                            type="text"
                            {...register(
                              `locations.${locationIndex}.redirectMappings.${mapIndex}.fromUrl`,
                            )}
                            placeholder="From URL Path (e.g., /source)"
                            className={`input input-bordered input-sm w-full join-item ${
                              locationErrors?.redirectMappings?.[mapIndex]
                                ?.fromUrl
                                ? "input-error"
                                : ""
                            }`}
                          />
                          <span className="join-item mx-2">→</span>
                          <input
                            type="text"
                            {...register(
                              `locations.${locationIndex}.redirectMappings.${mapIndex}.toUrl`,
                            )}
                            placeholder="To URL (e.g., https://site.com/dest)"
                            className={`input input-bordered input-sm w-full join-item ${
                              locationErrors?.redirectMappings?.[mapIndex]
                                ?.toUrl
                                ? "input-error"
                                : ""
                            }`}
                          />
                          <button
                            type="button"
                            className="btn btn-xs btn-error btn-ghost join-item" // Smaller button
                            onClick={() => removeMapping(mapIndex)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {locationErrors?.redirectMappings?.map(
                        (mapError, mapIndex) =>
                          mapError &&
                          !mapError.root && (
                            <div
                              key={`mapErr-${mapIndex}`}
                              className="text-error text-xs mt-1 ml-1"
                            >
                              {mapError.fromUrl && (
                                <p>From URL: {mapError.fromUrl.message}</p>
                              )}
                              {mapError.toUrl && (
                                <p>To URL: {mapError.toUrl.message}</p>
                              )}
                            </div>
                          ),
                      )}
                      {locationErrors?.redirectMappings?.root && (
                        <p className="text-error text-xs mt-1">
                          {locationErrors.redirectMappings.root.message}
                        </p>
                      )}
                      <button
                        type="button"
                        className="btn btn-xs btn-accent btn-outline" // Smaller button
                        onClick={() =>
                          appendMapping({
                            id: generateUniqueId("map_"),
                            fromUrl: "",
                            toUrl: "",
                          })
                        }
                      >
                        <Dashicon icon="plus" size={16} /> Add URL Mapping
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Page Exclusions */}
              <div className="form-control">
                <label className="label py-0">
                  <span className="label-text font-semibold flex items-center">
                    Page Exclusions
                    <HelpHover text="Define exceptions to your redirection rules. Pages matching these exclusions will not be redirected, even if they match other conditions." />
                  </span>
                </label>
                <div className="space-y-2">
                  {exclusionFields.map((exclusionField, exclIndex) => (
                    <div
                      key={exclusionField.id}
                      className="join flex items-center"
                    >
                      <select
                        {...register(
                          `locations.${locationIndex}.exclusions.${exclIndex}.type`,
                        )}
                        className={`select select-bordered select-sm join-item ${
                          locationErrors?.exclusions?.[exclIndex]?.type
                            ? "select-error"
                            : ""
                        }`}
                      >
                        <option value="url_equals">URL Path equals</option>
                        <option value="url_contains">URL Path contains</option>
                        <option value="query_contains">Query contains</option>
                        <option value="hash_contains">Hash contains</option>
                      </select>
                      <input
                        type="text"
                        {...register(
                          `locations.${locationIndex}.exclusions.${exclIndex}.value`,
                        )}
                        placeholder="Value to exclude"
                        className={`input input-bordered input-sm w-full join-item ${
                          locationErrors?.exclusions?.[exclIndex]?.value
                            ? "input-error"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        className="btn btn-xs btn-error btn-ghost join-item" // Smaller button
                        onClick={() => removeExclusion(exclIndex)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {locationErrors?.exclusions?.map(
                    (exclError, exclIndex) =>
                      exclError &&
                      !exclError.root && (
                        <div
                          key={`exclErr-${exclIndex}`}
                          className="text-error text-xs mt-1 ml-1"
                        >
                          {exclError.type && (
                            <p>Type: {exclError.type.message}</p>
                          )}
                          {exclError.value && (
                            <p>Value: {exclError.value.message}</p>
                          )}
                        </div>
                      ),
                  )}
                  {locationErrors?.exclusions?.root && (
                    <p className="text-error text-xs mt-1">
                      {locationErrors.exclusions.root.message}
                    </p>
                  )}
                  <button
                    type="button"
                    className="btn btn-xs btn-accent btn-outline" // Smaller button
                    onClick={() =>
                      appendExclusion({
                        id: generateUniqueId("excl_"),
                        value: "",
                        type: "url_equals",
                      })
                    }
                  >
                    <Dashicon icon="plus" size={16} /> Add Exclusion
                  </button>
                </div>
              </div>
              {/* Additional Options */}
              <div className="form-control">
                <label className="label py-0">
                  <span className="label-text font-semibold flex items-center">
                    Additional Options
                    <HelpHover text="Configure how URL paths and query parameters are handled during redirection." />
                  </span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm">
                      {" "}
                      {/* Smaller text */}
                      Pass page path to redirect URLs
                      <HelpHover text="When enabled, the current page path (e.g., /about-us/) will be appended to the destination URL. Only applies when 'Page Targeting' is 'All pages'." />
                    </span>
                    <Controller
                      name={`locations.${locationIndex}.passPath`}
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Toggle
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                        />
                      )}
                    />
                    {locationErrors?.passPath && (
                      <p className="text-error text-xs mt-1">
                        {locationErrors.passPath.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-sm">
                      {" "}
                      {/* Smaller text */}
                      Pass query string to redirect URLs
                      <HelpHover text="When enabled, query parameters from the current URL (e.g., ?utm_source=google) will be preserved and added to the destination URL." />
                    </span>
                    <Controller
                      name={`locations.${locationIndex}.passQuery`}
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Toggle
                          checked={value}
                          onChange={(e) => onChange(e.target.checked)}
                        />
                      )}
                    />
                    {locationErrors?.passQuery && (
                      <p className="text-error text-xs mt-1">
                        {locationErrors.passQuery.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Delete Location Button */}
              <div className="flex justify-end pt-4">
                {" "}
                {/* Add padding top */}
                <button
                  type="button"
                  className="btn btn-sm btn-error btn-outline"
                  onClick={onDelete}
                  disabled={isLastLocation}
                >
                  Delete Location
                </button>
              </div>
            </div>{" "}
            {/* End space-y */}
          </div> // End expanded content container
        )}
      </div>{" "}
      {/* End card-body */}
    </div> // End card
  );
}
