import { registerBlockType } from "@wordpress/blocks";
import {
  InnerBlocks,
  InspectorControls,
  useBlockProps,
} from "@wordpress/block-editor";
import { useState } from "@wordpress/element";
import metadata from "./block.json";
import {
  BlockAttributes,
  LocalGeoRule,
} from "../../types/types";
import "./geo-content.css";
import { GeoRulesPanel } from "../../components/geo-rules-panel";

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
            Maki Geo Targeted Content{" "}
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
          {`[mgeo_content rule="${globalRuleId}"]`}
          <InnerBlocks.Content />
          {`[/mgeo_content]`}
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
          {`[mgeo_content ${parts.join(" ")}]`}
          <InnerBlocks.Content />
          {`[/mgeo_content]`}
        </div>
      );
    }

    // Fallback for empty rules
    return (
      <>
        {`[mgeo_content]`}
        <InnerBlocks.Content />
        {`[/mgeo_content]`}
      </>
    );
  },
});
