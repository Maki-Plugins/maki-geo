import { useState } from "@wordpress/element";
import { TextControl, ToggleControl } from "@wordpress/components";
import { GeoConditionEditor } from "../../components/geo-condition-editor/geo-condition-editor";
import { GeoCondition, RedirectionRule } from "../../types/types";

interface RedirectionWizardProps {
  type: "one-way" | "same-site" | "query-string";
  onComplete: (rule: RedirectionRule) => void;
  onCancel: () => void;
}

export function RedirectionWizard({ type, onComplete, onCancel }: RedirectionWizardProps): JSX.Element {
  const [currentStep, setCurrentStep] = useState(1);
  const [rule, setRule] = useState<Partial<RedirectionRule>>({
    type,
    name: "",
    isEnabled: true,
    conditions: [{ type: "country", value: "", operator: "is" }],
    fromUrls: [],
    toUrl: "",
  });

  const updateRule = (updates: Partial<RedirectionRule>) => {
    setRule({ ...rule, ...updates });
  };

  const handleConditionsChange = (conditions: GeoCondition[], operator: "AND" | "OR") => {
    updateRule({ conditions });
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate step 1
      if (!rule.name?.trim()) {
        alert("Please enter a rule name");
        return;
      }
      if (!rule.conditions?.length || !rule.conditions[0].value) {
        alert("Please set at least one geo condition");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const renderStep1 = () => (
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
    <div className="bg-white p-6 rounded-none">
      <div className="mb-8">
        <div className="flex items-center">
          <div className="flex-1">
            <div className="text-sm text-gray-600">Step {currentStep} of 3</div>
            <h2 className="text-2xl font-medium">
              {type === "one-way" && "One-Way Redirection"}
              {type === "same-site" && "Same-Site Redirection"}
              {type === "query-string" && "Query String Redirection"}
            </h2>
          </div>
        </div>
      </div>

      {currentStep === 1 && renderStep1()}

      <div className="flex justify-between mt-8">
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleNext}>
          Next Step
        </button>
      </div>
    </div>
  );
}
