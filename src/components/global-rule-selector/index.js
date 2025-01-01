import { SelectControl } from "@wordpress/components";

export function GlobalRuleSelector({ globalRules, selectedRuleIds, onChange }) {
  return (
    <div className="global-rule-selector">
      <SelectControl
        label="Select Global Rules"
        multiple
        value={selectedRuleIds}
        options={globalRules.map((rule) => ({
          label: rule.name,
          value: rule.id,
        }))}
        onChange={(newIds) => onChange(newIds)}
      />
    </div>
  );
}
