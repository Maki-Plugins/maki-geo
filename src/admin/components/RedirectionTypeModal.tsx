import { useState } from "@wordpress/element";
import { TextControl, ToggleControl } from "@wordpress/components";
import { GeoConditionEditor } from "../../components/geo-condition-editor/geo-condition-editor";
import { GeoCondition, RedirectionRule } from "../../types/types";

export type RedirectionType = "one-way" | "same-site" | "popup" | "query-string";
export type WizardStep = "type" | "settings" | "urls" | "review";

interface RedirectionTypeOption {
  type: RedirectionType;
  title: string;
  description: string;
  example: string;
}

const redirectionTypes: RedirectionTypeOption[] = [
  {
    type: "one-way",
    title: "One-way redirection",
    description:
      "Redirect visitors from one URL to another based on their location.",
    example: "example.com → example.fr (for visitors from France)",
  },
  {
    type: "same-site",
    title: "Same-site redirection",
    description: "Redirect visitors to a different path on the same domain.",
    example: "example.com → example.com/fr (for visitors from France)",
  },
  {
    type: "query-string",
    title: "Query String redirection",
    description: "Add location parameters to URLs without changing the page.",
    example: "example.com → example.com?country=fr",
  },
  {
    type: "popup",
    title: "Popup redirection",
    description:
      "Show a popup asking visitors if they want to be redirected to a location-specific page.",
    example: "Show popup: 'Visit our French site?' → example.fr",
  },
];

interface RedirectionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (rule: RedirectionRule) => void;
}

export function RedirectionTypeModal({
  isOpen,
  onClose,
  onComplete,
}: RedirectionTypeModalProps): JSX.Element {
  const [currentStep, setCurrentStep] = useState<WizardStep>("type");
  const [selectedType, setSelectedType] = useState<RedirectionType | null>(null);
  const [rule, setRule] = useState<Partial<RedirectionRule>>({
    type: null,
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

  const handleTypeSelect = (type: RedirectionType) => {
    setSelectedType(type);
    setRule(prev => ({ ...prev, type }));
    setCurrentStep("settings");
  };

  const handleConditionsChange = (conditions: GeoCondition[], operator: "AND" | "OR") => {
    updateRule({ conditions, operator });
  };

  const handleNext = () => {
    switch (currentStep) {
      case "type":
        if (!selectedType) {
          alert("Please select a redirection type");
          return;
        }
        setCurrentStep("settings");
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
        setCurrentStep("urls");
        break;
      case "urls":
        // URL validation will go here
        setCurrentStep("review");
        break;
      case "review":
        onComplete(rule as RedirectionRule);
        onClose();
        break;
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
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-medium">Basic Settings</h3>
      
      <div className="form-control w-full max-w-md">
        <TextControl
          label="Rule Name"
          value={rule.name}
          onChange={(name) => updateRule({ name })}
          placeholder="e.g., EU to English Site"
        />
      </div>

      {currentStep === "settings" && renderSettings()}

      <div className="form-control">
        <ToggleControl
          label="Enable Rule"
          checked={rule.isEnabled}
          onChange={(isEnabled) => updateRule({ isEnabled })}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Geo Conditions</span>
        </label>
        <GeoConditionEditor
          conditions={rule.conditions || []}
          operator="OR"
          onChange={handleConditionsChange}
        />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-none hard-shadow max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl mb-2 text-secondary">
            Choose redirection type
          </h2>
          <button className="btn btn-sm btn-circle" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {redirectionTypes.map((option) => (
            <div
              key={option.type}
              className={`
                border rounded-none p-4 cursor-pointer transition-all
                ${
                  selectedType === option.type
                    ? "border-primary bg-primary bg-opacity-5"
                    : "border-gray-200 hover:border-primary"
                }
              `}
              onClick={() => setSelectedType(option.type)}
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

        <div className="flex justify-end gap-2">
          {currentStep === "type" ? (
            <>
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!selectedType}
                onClick={() => selectedType && handleTypeSelect(selectedType)}
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
