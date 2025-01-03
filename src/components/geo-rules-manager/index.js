import { Button } from "@wordpress/components";
import { GeoRuleEditor } from "../geo-rule-editor";
import { GlobalRule } from "../../types";
import { FC } from 'react';

interface GeoRulesManagerProps {
  rules: GlobalRule[];
  onChange: (rules: GlobalRule[]) => void;
}

export const GeoRulesManager: FC<GeoRulesManagerProps> = ({ rules, onChange }) => {
  const addRule = () => {
    const newRule: GlobalRule = {
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

  const updateRule = (index: number, updatedRule: GlobalRule) => {
    const newRules = [...rules];
    newRules[index] = updatedRule;
    onChange(newRules);
  };

  const removeRule = (index: number) => {
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

      <Button variant="primary" onClick={addRule} className="add-rule-button">
        Add Global Rule
      </Button>
    </div>
  );
}
