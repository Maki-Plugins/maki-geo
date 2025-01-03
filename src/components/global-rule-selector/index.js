import { SelectControl } from "@wordpress/components";
import { FC } from "react";
import { GlobalRule } from "../../types";

interface GlobalRuleSelectorProps {
  globalRules: GlobalRule[];
  selectedRuleIds: string[];
  onChange: (newIds: string[]) => void;
}

export const GlobalRuleSelector: FC<GlobalRuleSelectorProps> = ({
  globalRules,
  selectedRuleIds,
  onChange,
}) => {
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
        onChange={(newIds: string[]) => onChange(newIds)}
      />
    </div>
  );
};
