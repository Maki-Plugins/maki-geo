import { registerBlockType } from "@wordpress/blocks";
import {
  useBlockProps,
  InspectorControls,
  InnerBlocks,
} from "@wordpress/block-editor";
import {
  PanelBody,
  SelectControl,
  TextControl,
  RangeControl,
  ColorPicker,
} from "@wordpress/components";
import { GeoRulesPanel } from "../../components/geo-rules-panel";
import metadata from "./block.json";
import "./geo-popup.css";
import { LocalGeoRule } from "types";

interface PopupStyle {
  width: string;
  height: string;
  backgroundColor: string;
  borderRadius: string;
}

interface PopupAttributes {
  popupStyle: PopupStyle;
  triggerType: "immediate" | "delayed" | "exit";
  triggerDelay: number;
  ruleType: "local" | "global";
  localRule: LocalGeoRule | null;
  globalRuleId: string | null;
}

interface EditProps {
  attributes: PopupAttributes;
  setAttributes: (attributes: Partial<PopupAttributes>) => void;
}

interface SaveProps {
  attributes: PopupAttributes;
}

//@ts-ignore
registerBlockType<PopupAttributes>(metadata.name, {
  edit: ({ attributes, setAttributes }: EditProps) => {
    const {
      popupStyle,
      triggerType,
      triggerDelay,
      ruleType,
      localRule,
      globalRuleId,
    } = attributes;

    const blockProps = useBlockProps({
      className: "geo-popup-editor",
    });

    const updateStyle = (property: keyof PopupStyle, value: string) => {
      setAttributes({
        popupStyle: {
          ...popupStyle,
          [property]: value,
        },
      });
    };

    return (
      <>
        <InspectorControls>
          <GeoRulesPanel
            ruleType={ruleType}
            localRule={localRule}
            globalRuleId={globalRuleId}
            onRuleTypeChange={(type) => setAttributes({ ruleType: type })}
            onLocalRuleChange={(rule) => setAttributes({ localRule: rule })}
            onGlobalRuleIdChange={(id) => setAttributes({ globalRuleId: id })}
          />
          <PanelBody title="Popup Settings">
            <SelectControl
              label="Trigger Type"
              value={triggerType}
              options={[
                { label: "Immediate", value: "immediate" },
                { label: "Delayed", value: "delayed" },
                { label: "On Exit Intent", value: "exit" },
              ]}
              onChange={(value: string) =>
                setAttributes({
                  triggerType: value as "immediate" | "delayed" | "exit",
                })
              }
            />
            {triggerType === "delayed" && (
              <TextControl
                type="number"
                label="Delay (seconds)"
                value={triggerDelay}
                onChange={(value: string) =>
                  setAttributes({ triggerDelay: parseInt(value) || 0 })
                }
                min="0"
              />
            )}
            <SelectControl
              label="Width"
              value={popupStyle.width}
              options={[
                { label: "Small (400px)", value: "400px" },
                { label: "Medium (600px)", value: "600px" },
                { label: "Large (800px)", value: "800px" },
                { label: "Full Width (90%)", value: "90%" },
              ]}
              onChange={(value: string) => updateStyle("width", value)}
            />
            <div>
              <label>Background Color</label>
              <ColorPicker
                color={popupStyle.backgroundColor}
                onChange={(value: string) =>
                  updateStyle("backgroundColor", value)
                }
              />
            </div>
            <RangeControl
              label="Border Radius (px)"
              value={parseInt(popupStyle.borderRadius)}
              onChange={(value: number | undefined) =>
                value !== undefined && updateStyle("borderRadius", `${value}px`)
              }
              min={0}
              max={50}
            />
          </PanelBody>
        </InspectorControls>

        <div {...blockProps}>
          <div className="geo-popup-editor__content" style={popupStyle}>
            <InnerBlocks />
          </div>
        </div>
      </>
    );
  },

  save: ({ attributes }: SaveProps) => {
    const { popupStyle, triggerType, triggerDelay } = attributes;

    const wrapperProps = useBlockProps.save({
      className: "geo-popup-overlay",
    });

    const containerProps = {
      className: "geo-popup-container",
      style: popupStyle,
      "data-trigger": triggerType,
      "data-delay": triggerDelay,
    };

    return (
      <div {...wrapperProps}>
        <div {...containerProps}>
          <button className="geo-popup-close" aria-label="Close popup">
            ×
          </button>
          <InnerBlocks.Content />
        </div>
      </div>
    );
  },
});
