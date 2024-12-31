import { registerBlockType } from "@wordpress/blocks";
import {
  InnerBlocks,
  InspectorControls,
  useBlockProps,
} from "@wordpress/block-editor";
import {
  PanelBody,
  TextControl,
  SelectControl,
  Button,
} from "@wordpress/components";
import metadata from "./block.json";

registerBlockType(metadata.name, {
  edit: ({ attributes, setAttributes }) => {
    const { geoRules = [] } = attributes;
    const blockProps = useBlockProps({
      style: {
        border: "2px dashed #ccc",
        padding: "20px",
        backgroundColor: "#f9f9f9",
        minHeight: "100px",
        position: "relative",
      },
    });

    const addGeoRule = () => {
      setAttributes({
        geoRules: [...geoRules, { country: "", action: "show" }],
      });
    };

    const updateGeoRule = (index, field, value) => {
      const newRules = [...geoRules];
      newRules[index] = { ...newRules[index], [field]: value };
      setAttributes({ geoRules: newRules });
    };

    const removeGeoRule = (index) => {
      setAttributes({
        geoRules: geoRules.filter((_, i) => i !== index),
      });
    };

    return (
      <>
        <InspectorControls>
          <PanelBody title="Geo Targeting Rules">
            {geoRules.map((rule, index) => (
              <div key={index} style={{ marginBottom: "20px" }}>
                <TextControl
                  label="Country"
                  value={rule.country}
                  onChange={(value) => updateGeoRule(index, "country", value)}
                />
                <SelectControl
                  label="Action"
                  value={rule.action}
                  options={[
                    { label: "Show", value: "show" },
                    { label: "Hide", value: "hide" },
                  ]}
                  onChange={(value) => updateGeoRule(index, "action", value)}
                />
                <Button isDestructive onClick={() => removeGeoRule(index)}>
                  Remove Rule
                </Button>
              </div>
            ))}
            <Button isPrimary onClick={addGeoRule}>
              Add Geo Rule
            </Button>
          </PanelBody>
        </InspectorControls>

        <div {...blockProps}>
          <div
            className="geo-target-block__label"
            style={{
              position: "absolute",
              top: "-25px",
              left: "0",
              background: "#f0f0f0",
              padding: "2px 8px",
              borderRadius: "3px",
              fontSize: "12px",
              color: "#666",
            }}
          >
            Geo Target Block{" "}
            {geoRules.length ? `(${geoRules.length} rules)` : ""}
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
