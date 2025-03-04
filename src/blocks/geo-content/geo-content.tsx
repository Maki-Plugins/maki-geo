import { registerBlockType } from "@wordpress/blocks";
import {
  InnerBlocks,
  InspectorControls,
  useBlockProps,
} from "@wordpress/block-editor";
import metadata from "./block.json";
import { BlockAttributes, GeoRule } from "../../types/types";
import "./geo-content.css";
import { GeoRulesPanel } from "../../components/geo-rules-panel/geo-rules-panel";
import updateCategoryIcon from "./update-category-icon";

const { name, ...settings } = metadata;
updateCategoryIcon();

//@ts-ignore
registerBlockType<BlockAttributes>(name, {
  ...settings,
  edit: ({ attributes, setAttributes }) => {
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

    const { geoRule: rule = createDefaultRule() } = attributes;
    const blockProps = useBlockProps({
      className: "geo-target-block",
    });

    return (
      <>
        <InspectorControls>
          <GeoRulesPanel
            geoRule={rule}
            onRuleChange={(newRule) => setAttributes({ geoRule: newRule })}
          />
        </InspectorControls>

        <div {...blockProps}>
          <div className="geo-target-block__label">
            Maki Geo Targeted Content
          </div>
          <InnerBlocks
            renderAppender={() => <InnerBlocks.ButtonBlockAppender />}
          />
        </div>
      </>
    );
  },
  save: ({ attributes }) => {
    const { geoRule } = attributes;
    if (geoRule) {
      // Convert conditions to readable format
      const parts: string[] = [];

      geoRule.conditions.forEach((condition) => {
        const not = condition.operator === "is not" ? "!" : "";
        parts.push(`${condition.type}="${not}${condition.value}"`);
      });

      if (geoRule.operator === "OR") {
        parts.push('match="any"');
      }

      parts.push(`action="${geoRule.action}"`);

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
