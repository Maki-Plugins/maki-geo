import { registerBlockType } from "@wordpress/blocks";
import {
  InnerBlocks,
  InspectorControls,
  useBlockProps,
} from "@wordpress/block-editor";
import { PanelBody } from "@wordpress/components";
import { GeoRules } from "../../components/geo-rules";
import { GlobalRuleSelector } from "../../components/global-rule-selector";
import metadata from "./block.json";
import "./geo-content.css";


registerBlockType(metadata.name, {
  edit: ({ attributes, setAttributes }) => {
    const { localRules = [], globalRuleIds = [] } = attributes;
    const blockProps = useBlockProps({
      className: "geo-target-block",
    });


    return (
      <>
        <InspectorControls>
          <PanelBody title="Global Rules" initialOpen={true}>
            <GlobalRuleSelector
              globalRules={window.geoUtilsSettings?.globalRules || []}
              selectedRuleIds={globalRuleIds}
              onChange={(newIds) => setAttributes({ globalRuleIds: newIds })}
            />
          </PanelBody>
          <PanelBody title="Local Rules" initialOpen={false}>
            <GeoRules
              rules={localRules}
              onChange={(newRules) => setAttributes({ localRules: newRules })}
            />
          </PanelBody>
        </InspectorControls>

        <div {...blockProps}>
          <div className="geo-target-block__label">
            Geo Targeted Content{" "}
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
