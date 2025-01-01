import { Button } from "@wordpress/components";
import { GeoRuleEditor } from "../geo-rule-editor";

export function GeoRulesManager({ rules, onChange }) {
  const addRule = () => {
    const newRule = {
      id: Date.now().toString(),
      name: `Rule ${rules.length + 1}`,
      conditions: [
        {
          type: "country",
          value: "",
        },
      ],
      operator: "AND",
      action: "show",
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (index, updatedRule) => {
    const newRules = [...rules];
    newRules[index] = updatedRule;
    onChange(newRules);
  };

  const removeRule = (index) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="geo-rules-manager">
      {rules.map((rule, index) => (
        <div key={rule.id} className="geo-rule-wrapper">
          <GeoRuleEditor
            rule={rule}
            onChange={(updatedRule) => updateRule(index, updatedRule)}
            showName={true}
          />
          <Button
            isDestructive
            onClick={() => removeRule(index)}
            className="remove-rule-button"
          >
            Remove Rule
          </Button>
        </div>
      ))}

      <Button variant="primary" onClick={addRule} className="add-rule-button">
        Add Global Rule
      </Button>
    </div>
  );
}
