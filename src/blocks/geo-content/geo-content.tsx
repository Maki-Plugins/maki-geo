import { registerBlockType } from "@wordpress/blocks";
import {
  InnerBlocks,
  InspectorControls,
  useBlockProps,
} from "@wordpress/block-editor";
import { PanelBody, RadioControl } from "@wordpress/components";
import { GeoRuleEditor } from "../../components/geo-rule-editor";
import { useState } from "@wordpress/element";
import metadata from "./block.json";
import {
  BlockAttributes,
  GeoRule,
  GlobalGeoRule,
  LocalGeoRule,
} from "../../types";
import "./geo-content.css";
import React from "react";
import { GeoRulesPanel } from "../../components/geo-rules-panel";

interface SelectChangeEvent extends React.ChangeEvent<HTMLSelectElement> {}

const { name, ...settings } = metadata;

//@ts-ignore
registerBlockType<BlockAttributes>(name, {
  ...settings,
  edit: ({ attributes, setAttributes }) => {
    const {
      ruleType = "local",
      localRule = null,
      globalRuleId = null,
    } = attributes;
    const [selectedType, setSelectedType] = useState<"local" | "global">(
      ruleType
    );
    const blockProps = useBlockProps({
      className: "geo-target-block",
    });

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

    const handleRuleTypeChange = (newType: "local" | "global"): void => {
      setSelectedType(newType);
      setAttributes({
        ruleType: newType,
        localRule:
          newType === "local" ? localRule || createDefaultRule() : null,
        globalRuleId: newType === "global" ? globalRuleId : null,
      });
    };

    return (
      <>
        <InspectorControls>
          <GeoRulesPanel
            ruleType={selectedType}
            localRule={localRule}
            globalRuleId={globalRuleId}
            onRuleTypeChange={handleRuleTypeChange}
            onLocalRuleChange={(newRule) =>
              setAttributes({ localRule: newRule })
            }
            onGlobalRuleIdChange={(id) => setAttributes({ globalRuleId: id })}
          />
        </InspectorControls>

        <div {...blockProps}>
          <div className="geo-target-block__label">
            Geo Targeted Content{" "}
            {
              <span className="geo-target-type">
                ({selectedType === "global" ? "Global Rule" : "Local Rule"})
              </span>
            }
          </div>
          <InnerBlocks
            renderAppender={() => <InnerBlocks.ButtonBlockAppender />}
          />
        </div>
      </>
    );
  },
  save: ({ attributes }) => {
    const { localRule, globalRuleId, ruleType } = attributes;

    if (ruleType === "global" && globalRuleId) {
      return (
        <div>
          {`[geo_content rule="${globalRuleId}"]`}
          <InnerBlocks.Content />
          {`[/geo_content]`}
        </div>
      );
    }

    if (localRule) {
      // Convert conditions to readable format
      const parts: string[] = [];
      
      localRule.conditions.forEach(condition => {
        const not = condition.operator === "is not" ? "!" : "";
        parts.push(`${condition.type}="${not}${condition.value}"`);
      });

      if (localRule.operator === "OR") {
        parts.push('match="any"');
      }
      
      parts.push(`action="${localRule.action}"`);

      return (
        <div>
          {`[geo_content ${parts.join(" ")}]`}
          <InnerBlocks.Content />
          {`[/geo_content]`}
        </div>
      );
    }

    // Fallback for empty rules
    return (
      <div>
        {`[geo_content]`}
        <InnerBlocks.Content />
        {`[/geo_content]`}
      </div>
    );
  },
});
