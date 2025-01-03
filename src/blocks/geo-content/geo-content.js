import { registerBlockType } from '@wordpress/blocks';
import {
  InnerBlocks,
  InspectorControls,
  useBlockProps,
} from '@wordpress/block-editor';
import { PanelBody, RadioControl, SelectControl } from '@wordpress/components';
import { GeoRuleEditor } from '../../components/geo-rule-editor';
import { useState } from '@wordpress/element';
import metadata from './block.json';
import { BlockAttributes, GeoRule, GlobalRule } from '../../types';
import './geo-content.css';
import React from 'react';

interface SelectChangeEvent extends React.ChangeEvent<HTMLSelectElement> {}

registerBlockType<BlockAttributes>(metadata.name, {
  edit: ({ attributes, setAttributes }) => {
    const {
      ruleType = 'local',
      localRule = null,
      globalRuleId = null,
    } = attributes;
    const [selectedType, setSelectedType] = useState<'local' | 'global'>(ruleType);
    const blockProps = useBlockProps({
      className: 'geo-target-block',
    });

    const globalRules: GlobalRule[] = window.geoUtilsData?.globalRules || [];

    const createDefaultRule = (): GeoRule => ({
      conditions: [
        {
          type: 'country',
          value: '',
        },
      ],
      operator: 'AND',
      action: 'show',
    });

    const handleRuleTypeChange = (newType: 'local' | 'global'): void => {
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
          <PanelBody title="Geo Targeting" initialOpen={true}>
            <RadioControl
              label="Rule Type"
              selected={selectedType}
              options={[
                { label: "Create Local Rule", value: "local" },
                { label: "Use Global Rule", value: "global" }
              ]}
              onChange={handleRuleTypeChange}
            />

            {selectedType === "global" && (
              <select
                value={globalRuleId || ""}
                onChange={(e: SelectChangeEvent) =>
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
            {(
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
