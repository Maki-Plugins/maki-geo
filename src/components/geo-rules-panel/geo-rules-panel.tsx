import { PanelBody } from "@wordpress/components";
import { GeoRuleEditor } from "../geo-rule-editor/geo-rule-editor";
import { GeoRule } from "../../types/types";
import React from "react";

interface GeoRulesPanelProps {
  geoRule: GeoRule | null;
  onRuleChange: (rule: GeoRule) => void;
}

export const GeoRulesPanel: React.FC<GeoRulesPanelProps> = ({
  geoRule,
  onRuleChange,
}) => {
  const createDefaultRule = (): GeoRule => ({
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
      <GeoRuleEditor
        rule={geoRule || createDefaultRule()}
        onChange={(newRule: GeoRule) => onRuleChange(newRule)}
        showName={false}
      />
    </PanelBody>
  );
};
