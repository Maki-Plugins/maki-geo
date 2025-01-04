import { PanelBody, RadioControl } from "@wordpress/components";
import { GeoRuleEditor } from "../geo-rule-editor";
import { GeoRule, GlobalGeoRule, LocalGeoRule } from "../../types";
import React from "react";

interface GeoRulesPanelProps {
  ruleType: "local" | "global";
  localRule: LocalGeoRule | null;
  globalRuleId: string | null;
  onRuleTypeChange: (type: "local" | "global") => void;
  onLocalRuleChange: (rule: LocalGeoRule) => void;
  onGlobalRuleIdChange: (id: string) => void;
}

interface SelectChangeEvent extends React.ChangeEvent<HTMLSelectElement> {}

export const GeoRulesPanel: React.FC<GeoRulesPanelProps> = ({
  ruleType,
  localRule,
  globalRuleId,
  onRuleTypeChange,
  onLocalRuleChange,
  onGlobalRuleIdChange,
}) => {
  const globalRules: GlobalGeoRule[] = window.geoUtilsData?.globalRules || [];

  const createDefaultRule = (): LocalGeoRule => ({
    ruleType: "local",
    conditions: [
      {
        type: "country",
        value: "",
        operator: "is",
      },
    ],
    operator: "AND",
    action: "show",
  });

  return (
    <PanelBody title="Geo Targeting" initialOpen={true}>
      <RadioControl
        label="Rule Type"
        selected={ruleType}
        options={[
          { label: "Create Local Rule", value: "local" },
          { label: "Use Global Rule", value: "global" },
        ]}
        onChange={(value) => onRuleTypeChange(value as "local" | "global")}
      />

      {ruleType === "global" && (
        <select
          value={globalRuleId || ""}
          onChange={(e: SelectChangeEvent) => onGlobalRuleIdChange(e.target.value)}
          style={{ width: "100%", marginTop: "10px" }}
        >
          <option value="">Select a global rule</option>
          {globalRules.map((rule) => (
            <option key={rule.id} value={rule.id}>
              {rule.name}
            </option>
          ))}
        </select>
      )}

      {ruleType === "local" && (
        <GeoRuleEditor
          rule={localRule || createDefaultRule()}
          onChange={(newRule: GeoRule) =>
            onLocalRuleChange(newRule as LocalGeoRule)
          }
          showName={false}
        />
      )}
    </PanelBody>
  );
};
