import { useState } from "@wordpress/element";
import { GeoConditionEditor } from "../../components/geo-condition-editor/geo-condition-editor";
import {
  ExclusionType,
  GeoCondition,
  PageExclusion,
  Redirection,
  RedirectionLocation,
  RedirectMapping,
} from "../../types/types";
import { Dashicon } from "@wordpress/components";
import Toggle from "./Toggle";
import HelpHover from "./HelpHover";

// Types
export type WizardStep = "settings" | "review";

interface RedirectionCardProps {
  onComplete: (redirection: Redirection) => void;
  isNew?: boolean;
  initialData?: Redirection;
}

export function RedirectionCard({
  onComplete,
  isNew = true,
  initialData,
}: RedirectionCardProps): JSX.Element {
  const [currentStep, setCurrentStep] = useState<WizardStep>("settings");
  const [redirectionName, setRedirectionName] = useState<string>(
    initialData?.name || "",
  );
  const [isEnabled, setIsEnabled] = useState<boolean>(
    initialData?.isEnabled ?? true,
  );
  const [locations, setLocations] = useState<RedirectionLocation[]>(
    initialData?.locations || [createDefaultLocation()],
  );
  const [expandedLocationId, setExpandedLocationId] = useState<string | null>(
    locations[0]?.id || null,
  );
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);

  function createDefaultLocation(): RedirectionLocation {
    return {
      id: `loc_${Date.now()}`,
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

  function addLocation() {
    const newLocation = createDefaultLocation();
    setLocations([...locations, newLocation]);
    setExpandedLocationId(newLocation.id);
  }

  function updateLocation(
    locationId: string,
    updates: Partial<RedirectionLocation>,
  ) {
    setLocations(
      locations.map((loc) =>
        loc.id === locationId ? { ...loc, ...updates } : loc,
      ),
    );
  }

  function deleteLocation(locationId: string) {
    if (locations.length <= 1) {
      return; // Don't delete the last location
    }
    setLocations(locations.filter((loc) => loc.id !== locationId));
    if (expandedLocationId === locationId) {
      setExpandedLocationId(null);
    }
  }

  function addRedirectMapping(locationId: string) {
    const location = locations.find((loc) => loc.id === locationId);
    if (!location) return;

    const newMapping = {
      id: `map_${Date.now()}`,
      fromUrl: "",
      toUrl: "",
    };

    updateLocation(locationId, {
      redirectMappings: [...location.redirectMappings, newMapping],
    });
  }

  function updateRedirectMapping(
    locationId: string,
    mappingId: string,
    updates: Partial<RedirectMapping>,
  ) {
    const location = locations.find((loc) => loc.id === locationId);
    if (!location) return;

    const updatedMappings = location.redirectMappings.map((mapping) =>
      mapping.id === mappingId ? { ...mapping, ...updates } : mapping,
    );

    updateLocation(locationId, { redirectMappings: updatedMappings });
  }

  function deleteRedirectMapping(locationId: string, mappingId: string) {
    const location = locations.find((loc) => loc.id === locationId);
    if (!location) return;

    const updatedMappings = location.redirectMappings.filter(
      (mapping) => mapping.id !== mappingId,
    );

    updateLocation(locationId, { redirectMappings: updatedMappings });
  }

  function addExclusion(locationId: string) {
    const location = locations.find((loc) => loc.id === locationId);
    if (!location) return;

    const newExclusion = {
      id: `excl_${Date.now()}`,
      value: "",
      type: "url_equals" as ExclusionType,
    };

    updateLocation(locationId, {
      exclusions: [...location.exclusions, newExclusion],
    });
  }

  function updateExclusion(
    locationId: string,
    exclusionId: string,
    updates: Partial<PageExclusion>,
  ) {
    const location = locations.find((loc) => loc.id === locationId);
    if (!location) return;

    const updatedExclusions = location.exclusions.map((exclusion) =>
      exclusion.id === exclusionId ? { ...exclusion, ...updates } : exclusion,
    );

    updateLocation(locationId, { exclusions: updatedExclusions });
  }

  function deleteExclusion(locationId: string, exclusionId: string) {
    const location = locations.find((loc) => loc.id === locationId);
    if (!location) return;

    const updatedExclusions = location.exclusions.filter(
      (exclusion) => exclusion.id !== exclusionId,
    );

    updateLocation(locationId, { exclusions: updatedExclusions });
  }

  function handleConditionsChange(
    locationId: string,
    conditions: GeoCondition[],
    operator: "AND" | "OR",
  ) {
    updateLocation(locationId, { conditions, operator });
  }

  function handleNext() {
    if (currentStep === "settings") {
      // Validate settings
      if (!redirectionName.trim()) {
        alert("Please enter a redirection name");
        return;
      }

      // Check if at least one location has valid conditions
      const hasValidLocation = locations.some(
        (loc) =>
          loc.conditions.length > 0 &&
          loc.conditions.every((c) => c.value.trim() !== ""),
      );

      if (!hasValidLocation) {
        alert("Please set at least one valid geo condition");
        return;
      }

      // Check if all locations have valid redirect URLs
      const hasInvalidRedirects = locations.some((loc) => {
        if (loc.pageTargetingType === "all" && !loc.redirectUrl.trim()) {
          return true;
        }
        if (
          loc.pageTargetingType === "specific" &&
          (loc.redirectMappings.length === 0 ||
            loc.redirectMappings.some(
              (m) => !m.fromUrl.trim() || !m.toUrl.trim(),
            ))
        ) {
          return true;
        }
        return false;
      });

      if (hasInvalidRedirects) {
        alert("Please set valid redirect URLs for all locations");
        return;
      }

      setCurrentStep("review");
    } else if (currentStep === "review") {
      // Create the final redirection object
      const redirection: Redirection = {
        id: `red_${Date.now()}`,
        name: redirectionName,
        locations: locations,
        isEnabled: isEnabled,
      };

      onComplete(redirection);
    }
  }

  function handleBack() {
    if (currentStep === "review") {
      setCurrentStep("settings");
    }
  }

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

  function renderLocationCard(location: RedirectionLocation, index: number) {
    const isExpanded = expandedLocationId === location.id;

    return (
      <div
        key={location.id}
        className="card border-neutral shadow-sm rounded-none max-w-full mb-4 mt-0"
      >
        <div className="card-body p-1">
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() =>
              setExpandedLocationId(isExpanded ? null : location.id)
            }
          >
            <div className="flex-1">
              <h3 className="font-bold text-base">
                {getLocationTitle(location, index)}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-ghost btn-square btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedLocationId(isExpanded ? null : location.id);
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
                  <GeoConditionEditor
                    conditions={location.conditions}
                    operator={location.operator}
                    onChange={(conditions, operator) =>
                      handleConditionsChange(location.id, conditions, operator)
                    }
                  />
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
                          name={`pageTargeting-${location.id}`}
                          className="radio radio-primary"
                          checked={location.pageTargetingType === "all"}
                          onChange={() =>
                            updateLocation(location.id, {
                              pageTargetingType: "all",
                            })
                          }
                        />
                        <span className="label-text ml-1">All pages</span>
                      </label>
                      <label className="label cursor-pointer">
                        <input
                          type="radio"
                          name={`pageTargeting-${location.id}`}
                          className="radio radio-primary"
                          checked={location.pageTargetingType === "specific"}
                          onChange={() =>
                            updateLocation(location.id, {
                              pageTargetingType: "specific",
                            })
                          }
                        />
                        <span className="label-text ml-1">Specific pages</span>
                      </label>
                    </div>
                  </div>

                  {location.pageTargetingType === "all" ? (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold flex items-center">
                          Redirect URL
                          <HelpHover text="The destination URL where visitors will be redirected to. Use a full URL including https://." />
                        </span>
                      </label>
                      <input
                        type="text"
                        value={location.redirectUrl}
                        onChange={(e) =>
                          updateLocation(location.id, {
                            redirectUrl: e.target.value,
                          })
                        }
                        placeholder="https://example.com"
                        className="input input-bordered input-sm w-full"
                      />
                    </div>
                  ) : (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold flex items-center">
                          Redirect URLs
                          <HelpHover text="Map specific source URLs to destination URLs. Each mapping defines which page redirects to where." />
                        </span>
                      </label>
                      <div className="space-y-2">
                        {location.redirectMappings.map((mapping) => (
                          <div
                            key={mapping.id}
                            className="join flex items-center"
                          >
                            <input
                              type="text"
                              value={mapping.fromUrl}
                              onChange={(e) =>
                                updateRedirectMapping(location.id, mapping.id, {
                                  fromUrl: e.target.value,
                                })
                              }
                              placeholder="From URL"
                              className="input input-bordered input-sm w-full join-item"
                            />
                            <span className="join-item mx-2">→</span>
                            <input
                              type="text"
                              value={mapping.toUrl}
                              onChange={(e) =>
                                updateRedirectMapping(location.id, mapping.id, {
                                  toUrl: e.target.value,
                                })
                              }
                              placeholder="To URL"
                              className="input input-bordered input-sm w-full join-item"
                            />
                            <button
                              className="btn btn-sm btn-error btn-ghost join-item"
                              onClick={() =>
                                deleteRedirectMapping(location.id, mapping.id)
                              }
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          className="btn btn-sm btn-accent btn-outline"
                          onClick={() => addRedirectMapping(location.id)}
                        >
                          <Dashicon icon="plus" /> Add URL Mapping
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold flex items-center">
                      Page Exclusions
                      <HelpHover text="Define exceptions to your redirection rules. Pages matching these exclusions will not be redirected, even if they match other conditions." />
                    </span>
                  </label>
                  <div className="space-y-2">
                    {location.exclusions.map((exclusion) => (
                      <div
                        key={exclusion.id}
                        className="join flex items-center"
                      >
                        <select
                          value={exclusion.type}
                          onChange={(e) =>
                            updateExclusion(location.id, exclusion.id, {
                              type: e.target.value as ExclusionType,
                            })
                          }
                          className="select select-bordered select-sm join-item"
                        >
                          <option value="url_equals">URL equals</option>
                          <option value="url_contains">URL contains</option>
                          <option value="query_contains">Query contains</option>
                          <option value="hash_contains">Hash contains</option>
                        </select>
                        <input
                          type="text"
                          value={exclusion.value}
                          onChange={(e) =>
                            updateExclusion(location.id, exclusion.id, {
                              value: e.target.value,
                            })
                          }
                          placeholder="URL or query/hash text"
                          className="input input-bordered input-sm w-full join-item"
                        />
                        <button
                          className="btn btn-sm btn-error btn-ghost join-item"
                          onClick={() =>
                            deleteExclusion(location.id, exclusion.id)
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-sm btn-accent btn-outline"
                      onClick={() => addExclusion(location.id)}
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
                        <HelpHover text="When enabled, the current page path will be appended to the destination URL." />
                      </span>
                      <Toggle
                        checked={location.passPath}
                        onChange={(e) =>
                          updateLocation(location.id, {
                            passPath: e.target.checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        Pass query string to redirect URLs
                        <HelpHover text="When enabled, query parameters from the current URL will be preserved and added to the destination URL." />
                      </span>
                      <Toggle
                        checked={location.passQuery}
                        onChange={(e) =>
                          updateLocation(location.id, {
                            passQuery: e.target.checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    className="btn btn-sm btn-error btn-outline"
                    onClick={() => deleteLocation(location.id)}
                    disabled={locations.length <= 1}
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

  function renderSettingsStep() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold flex items-center">
                Geo Redirect Name
                <HelpHover text="A descriptive name to identify this redirection rule in the admin panel." />
              </span>
            </label>
            <input
              type="text"
              value={redirectionName}
              onChange={(e) => setRedirectionName(e.target.value)}
              placeholder="US and CA to English site"
              className="input input-bordered input-sm w-full"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold flex items-center">
                Active
                <HelpHover text="Toggle to enable or disable this redirection rule without deleting it." />
              </span>
            </label>
            <div className="flex items-center gap-2">
              <Toggle
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
              />
            </div>
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold flex items-center">
              Redirect Locations
              <HelpHover text="Define different redirection rules based on visitor location. Add multiple locations for different geo-targeting scenarios." />
            </span>
          </label>
          <div className="space-y-2">
            {locations.map(renderLocationCard)}
            <button
              className="btn btn-sm btn-accent btn-outline"
              onClick={addLocation}
            >
              <Dashicon icon="plus" /> Add Location
            </button>
          </div>
        </div>

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
      </div>
    );
  }

  function renderReviewStep() {
    return (
      <div className="space-y-6">
        <div className="bg-base-200 p-4 rounded-none">
          <h3 className="text-lg font-semibold mb-2">Redirection Summary</h3>
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {redirectionName}
            </p>
            <p>
              <strong>Status:</strong> {isEnabled ? "Active" : "Inactive"}
            </p>
            <p>
              <strong>Locations:</strong> {locations.length}
            </p>

            {locations.map((location, index) => (
              <div key={location.id} className="ml-4 mt-2">
                <p className="font-medium">
                  {getLocationTitle(location, index)}
                </p>
                <ul className="list-disc list-inside ml-4">
                  <li>
                    Conditions:{" "}
                    {location.conditions
                      .map((c) => `${c.type} ${c.operator} ${c.value}`)
                      .join(` ${location.operator} `)}
                  </li>
                  <li>
                    {location.pageTargetingType === "all"
                      ? `Redirect all pages to: ${location.redirectUrl}`
                      : `Redirect ${location.redirectMappings.length} specific pages`}
                  </li>
                  {location.exclusions.length > 0 && (
                    <li>
                      {location.exclusions.length} page exclusion
                      {location.exclusions.length !== 1 ? "s" : ""}
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentStep === "settings" && renderSettingsStep()}
      {currentStep === "review" && renderReviewStep()}

      <div className="flex justify-end gap-2 mt-6">
        {currentStep === "settings" ? (
          <>
            <button className="btn btn-primary" onClick={handleNext}>
              Review & save
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost" onClick={handleBack}>
              Back
            </button>
            <button className="btn btn-primary" onClick={handleNext}>
              {isNew ? "Create Redirection" : "Update Redirection"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
