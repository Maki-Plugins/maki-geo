import { Button, Dashicon } from "@wordpress/components";
import { GeoRuleEditor } from "../geo-rule-editor";
import { GeoRule, GlobalGeoRule } from "../../types/types";

interface GeoRulesManagerProps {
  rules: GlobalGeoRule[];
  onChange: (rules: GlobalGeoRule[]) => void;
}

export function GeoRulesManager({ rules, onChange }: GeoRulesManagerProps) {
  const addRule = () => {
    const newRule: GlobalGeoRule = {
      id: Date.now().toString(),
      name: `Rule ${rules.length + 1}`,
      conditions: [
        {
          type: "country",
          value: "",
          operator: "is",
        },
      ],
      operator: "AND",
      action: "show",
      ruleType: "global",
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (index: number, updatedRule: GlobalGeoRule) => {
    const newRules = [...rules];
    newRules[index] = updatedRule;
    onChange(newRules);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="geo-rules-manager">
      <Button variant="primary" onClick={addRule} className="add-rule-button">
        <Dashicon icon="plus" /> Add Global Geo Rule
      </Button>
      <div className="geo-rules-wrapper">
        {rules.map((rule, index) => (
          <div key={rule.id} className="geo-rule-wrapper">
            <GeoRuleEditor
              rule={rule}
              onChange={(updatedRule: GeoRule) =>
                updateRule(index, updatedRule as GlobalGeoRule)
              }
              showName={true}
            />
            <div className="rule-actions">
              <Button
                variant="secondary"
                isDestructive
                onClick={() => removeRule(index)}
                className="remove-rule-button"
              >
                Remove Rule
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
