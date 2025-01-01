import { registerBlockType } from "@wordpress/blocks";
import {
  InnerBlocks,
  InspectorControls,
  useBlockProps,
} from "@wordpress/block-editor";
import { PanelBody } from "@wordpress/components";
import { GeoRules } from "../../components/geo-rules";
import metadata from "./block.json";
import "./geo-content.css";


registerBlockType(metadata.name, {
  edit: ({ attributes, setAttributes }) => {
    const { geoRules = [] } = attributes;
    const blockProps = useBlockProps({
      className: "geo-target-block",
    });


    return (
      <>
        <InspectorControls>
          <PanelBody title="Geo Targeting Rules" initialOpen={true}>
            <GeoRules 
              rules={geoRules}
              onChange={(newRules) => {
                setAttributes({ geoRules: newRules });
              }}
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
