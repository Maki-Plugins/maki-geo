import { registerBlockType } from "@wordpress/blocks";
import {
  InnerBlocks,
  InspectorControls,
  useBlockProps,
} from "@wordpress/block-editor";
import { PanelBody, RadioControl, Button } from "@wordpress/components";
import { GeoRuleEditor } from "../../components/geo-rule-editor";
import { useState } from "@wordpress/element";
import metadata from "./block.json";
import "./geo-content.css";

registerBlockType(metadata.name, {
  edit: ({ attributes, setAttributes }) => {
    const {
      ruleType = "none",
      localRule = null,
      globalRuleId = null,
    } = attributes;
    const [selectedType, setSelectedType] = useState(ruleType);
    const blockProps = useBlockProps({
      className: "geo-target-block",
    });

    const globalRules = window.geoUtilsSettings?.globalRules || [];

    const handleRuleTypeChange = (newType) => {
      setSelectedType(newType);
      setAttributes({
        ruleType: newType,
        localRule:
          newType === "local" ? localRule || createDefaultRule() : null,
        globalRuleId: newType === "global" ? globalRuleId : null,
      });
    };

    const createDefaultRule = () => ({
      conditions: [
        {
          type: "country",
          value: "",
        },
      ],
      operator: "AND",
      action: "show",
    });

    return (
      <>
        <InspectorControls>
          <PanelBody title="Geo Targeting" initialOpen={true}>
            <RadioControl
              label="Rule Type"
              selected={selectedType}
              options={[
                { label: "No Geo Targeting", value: "none" },
                { label: "Use Global Rule", value: "global" },
                { label: "Create Local Rule", value: "local" },
              ]}
              onChange={handleRuleTypeChange}
            />

            {selectedType === "global" && (
              <select
                value={globalRuleId || ""}
                onChange={(e) =>
                  setAttributes({ globalRuleId: e.target.value })
                }
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

            {selectedType === "local" && (
              <GeoRuleEditor
                rule={localRule || createDefaultRule()}
                onChange={(newRule) => setAttributes({ localRule: newRule })}
                showName={false}
              />
            )}
          </PanelBody>
        </InspectorControls>

        <div {...blockProps}>
          <div className="geo-target-block__label">
            Geo Targeted Content
            {selectedType !== "none" && (
              <span className="geo-target-type">
                ({selectedType === "global" ? "Global Rule" : "Local Rule"})
              </span>
            )}
          </div>
          <InnerBlocks
            renderAppender={() => <InnerBlocks.ButtonBlockAppender />}
          />
        </div>
      </>
    );
  },
  save: () => {
    const blockProps = useBlockProps.save();
    return (
      <div {...blockProps}>
        <InnerBlocks.Content />
      </div>
    );
  },
});
