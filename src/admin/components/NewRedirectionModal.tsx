import { useState } from "@wordpress/element";
import { GeoConditionEditor } from "../../components/geo-condition-editor/geo-condition-editor";
import { GeoCondition, RedirectionRule } from "../../types/types";

export type RedirectionType =
  | "one-way"
  | "same-site"
  | "popup"
  | "query-string";

export type WizardStep = "type" | "settings" | "urls" | "review";

interface RedirectionProps {
  type: RedirectionType;
  steps: WizardStep[];
}

interface NewRedirectionOption {
  redirection: RedirectionProps;
  title: string;
  description: string;
  example: string;
}

const redirectionTypes: NewRedirectionOption[] = [
  {
    redirection: { type: "one-way", steps: ["settings", "urls", "review"] },
    title: "One-way redirection",
    description:
      "Redirect visitors from one URL to another based on their location.",
    example: "example.com → example.fr (for visitors from France)",
  },
  {
    redirection: { type: "same-site", steps: ["settings", "urls", "review"] },
    title: "Same-site redirection",
    description: "Redirect visitors to a different path on the same domain.",
    example: "example.com → example.com/fr (for visitors from France)",
  },
  {
    redirection: {
      type: "query-string",
      steps: ["settings", "urls", "review"],
    },
    title: "Query String redirection",
    description: "Add location parameters to URLs without changing the page.",
    example: "example.com → example.com?country=fr",
  },
  {
    redirection: { type: "popup", steps: ["settings", "urls", "review"] },
    title: "Popup redirection",
    description:
      "Show a popup asking visitors if they want to be redirected to a location-specific page.",
    example: "Show popup: 'Visit our French site?' → example.fr",
  },
];

interface NewRedirectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (rule: RedirectionRule) => void;
}

export function NewRedirectionModal({
  isOpen,
  onClose,
  onComplete,
}: NewRedirectionModalProps): JSX.Element {
  const [currentStep, setCurrentStep] = useState<WizardStep>("type");
  const [selectedRedirectionType, setSelectedRedirectionType] =
    useState<RedirectionProps | null>(null);
  const [rule, setRule] = useState<Partial<RedirectionRule>>({
    type: undefined,
    name: "",
    isEnabled: true,
    conditions: [{ type: "country", value: "", operator: "is" }],
    fromUrls: [],
    toUrl: "",
  });

  if (!isOpen) return <></>;

  const updateRule = (updates: Partial<RedirectionRule>) => {
    setRule({ ...rule, ...updates });
  };

  const handleTypeSelect = (redirection: RedirectionProps) => {
    setSelectedRedirectionType(redirection);
    setRule((prev) => ({ ...prev, type: redirection.type }));
    setCurrentStep("settings");
  };

  const handleConditionsChange = (
    conditions: GeoCondition[],
    operator: "AND" | "OR",
  ) => {
    updateRule({ conditions, operator });
  };

  const handleNext = () => {
    // Validation
    switch (currentStep) {
      case "type":
        if (!selectedRedirectionType) {
          alert("Please select a redirection type");
          return;
        }
        break;
      case "settings":
        if (!rule.name?.trim()) {
          alert("Please enter a rule name");
          return;
        }
        if (!rule.conditions?.length || !rule.conditions[0].value) {
          alert("Please set at least one geo condition");
          return;
        }
        break;
      case "urls":
        // URL validation will go here
        break;
    }

    // Go to next step
    if (selectedRedirectionType) {
      const currentStepIndex = selectedRedirectionType.steps.findIndex(
        (x) => x == currentStep,
      );
      if (currentStepIndex + 1 == selectedRedirectionType.steps.length) {
        onComplete(rule as RedirectionRule);
        onClose();
      } else {
        setCurrentStep(selectedRedirectionType.steps[currentStepIndex + 1]);
      }
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case "settings":
        setCurrentStep("type");
        break;
      case "urls":
        setCurrentStep("settings");
        break;
      case "review":
        setCurrentStep("urls");
        break;
    }
    if (selectedRedirectionType) {
      const currentStepIndex = selectedRedirectionType.steps.findIndex(
        (x) => x == currentStep,
      );
      if (currentStepIndex > 0) {
        setCurrentStep(selectedRedirectionType.steps[currentStepIndex - 1]);
      } else {
        setCurrentStep("type");
      }
    }
  };

  const renderRedirectionTypes = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {redirectionTypes.map((option) => (
        <div
          key={option.redirection.type}
          className={`
                border rounded-none p-4 cursor-pointer transition-all
                ${
                  selectedRedirectionType === option.redirection
                    ? "border-primary bg-primary bg-opacity-5"
                    : "border-gray-200 hover:border-primary"
                }
              `}
          onClick={() => setSelectedRedirectionType(option.redirection)}
        >
          <h3 className="text-lg font-semibold mb-2">{option.title}</h3>
          <p className="text-gray-600 mb-4">{option.description}</p>
          <div className="bg-base-200 p-3">
            <span className="text-sm font-medium">Example:</span>
            <p className="text-sm text-gray-600">{option.example}</p>
          </div>
        </div>
      ))}
    </div>
  );

  function renderSteps(
    allSteps: WizardStep[] | undefined,
    currentStep: WizardStep,
  ) {
    if (!allSteps) return <></>;

    const currentStepIndex = allSteps.findIndex((x) => x == currentStep);
    return (
      <ul className="steps">
        {allSteps.map((step, index) => (
          <li
            className={`step ${currentStepIndex >= index ? "step-primary" : ""}`}
          >
            {wizardStepToTitle(step)}
          </li>
        ))}
        {/* <li className="step step-primary">Register</li>
        <li className="step step-primary">Choose plan</li>
        <li className="step">Purchase</li>
        <li className="step">Receive Product</li> */}
      </ul>
    );
  }

  const renderSettings = () => (
    <>
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">Rule name</span>
        </div>
        <input
          value={rule.name}
          onChange={(e) => updateRule({ name: e.target.value })}
          className="input input-bordered input-sm w-full max-w-xs"
          placeholder="e.g., EU to English Site"
        />
      </label>
      <div className="form-control">
        <div className="label">
          <span className="label-text">Activate rule</span>
        </div>
        <input
          type="checkbox"
          className="toggle"
          checked={rule.isEnabled}
          onChange={(e) => updateRule({ isEnabled: e.target.checked })}
          defaultChecked
        />
        {/* <ToggleControl
          label="Enable Rule"
          checked={rule.isEnabled}
          onChange={(isEnabled) => updateRule({ isEnabled })}
        /> */}
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Geo Conditions</span>
        </label>
        <GeoConditionEditor
          conditions={rule.conditions || []}
          operator={rule.operator || "OR"}
          onChange={handleConditionsChange}
        />
      </div>
    </>
  );

  function wizardStepToTitle(step: WizardStep) {
    switch (step) {
      case "type":
        return "Choose redirection type";
      case "settings":
        return "Basic settings";
      case "urls":
        return "Page targeting";
      case "review":
        return "Review & save";
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-none hard-shadow max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative flex justify-between items-center py-2 mb-6">
          <h2 className="text-2xl mb-2 text-secondary">
            {wizardStepToTitle(currentStep)}
          </h2>
          {currentStep !== "type" && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              {renderSteps(selectedRedirectionType?.steps, currentStep)}
            </div>
          )}
          <button className="btn btn-sm btn-circle" onClick={onClose}>
            ✕
          </button>
        </div>

        {currentStep === "type" && renderRedirectionTypes()}
        {currentStep === "settings" && renderSettings()}

        <div className="flex justify-end gap-2">
          {currentStep === "type" ? (
            <>
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!selectedRedirectionType}
                onClick={() =>
                  selectedRedirectionType &&
                  handleTypeSelect(selectedRedirectionType)
                }
              >
                Continue
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={handleBack}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleNext}>
                {currentStep === "review" ? "Create Rule" : "Next Step"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
