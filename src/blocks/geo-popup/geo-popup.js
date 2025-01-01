import { registerBlockType } from '@wordpress/blocks';
import {
    useBlockProps,
    InspectorControls,
    InnerBlocks
} from '@wordpress/block-editor';
import {
    PanelBody,
    SelectControl,
    TextControl,
    RangeControl,
    ColorPicker,
} from '@wordpress/components';
import metadata from './block.json';
import './geo-popup.css';

registerBlockType(metadata.name, {
    edit: ({ attributes, setAttributes }) => {
        const {
            geoRules = [],
            popupStyle,
            triggerType,
            triggerDelay,
        } = attributes;

        const blockProps = useBlockProps({
            className: 'geo-popup-editor'
        });

        const updateStyle = (property, value) => {
            setAttributes({
                popupStyle: {
                    ...popupStyle,
                    [property]: value,
                }
            });
        };

        return (
            <>
                <InspectorControls>
                    <PanelBody title="Popup Settings">
                        <SelectControl
                            label="Trigger Type"
                            value={triggerType}
                            options={[
                                { label: 'Immediate', value: 'immediate' },
                                { label: 'Delayed', value: 'delayed' },
                                { label: 'On Exit Intent', value: 'exit' },
                            ]}
                            onChange={(value) => setAttributes({ triggerType: value })}
                        />
                        {triggerType === 'delayed' && (
                            <RangeControl
                                label="Delay (seconds)"
                                value={triggerDelay}
                                onChange={(value) => setAttributes({ triggerDelay: value })}
                                min={0}
                                max={60}
                            />
                        )}
                        <TextControl
                            label="Width"
                            value={popupStyle.width}
                            onChange={(value) => updateStyle('width', value)}
                        />
                        <div>
                            <label>Background Color</label>
                            <ColorPicker
                                color={popupStyle.backgroundColor}
                                onChange={(value) => updateStyle('backgroundColor', value)}
                            />
                        </div>
                        <RangeControl
                            label="Border Radius (px)"
                            value={parseInt(popupStyle.borderRadius)}
                            onChange={(value) => updateStyle('borderRadius', `${value}px`)}
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

    save: ({ attributes }) => {
        const {
            popupStyle,
            triggerType,
            triggerDelay,
        } = attributes;

        // Create wrapper props for the overlay
        const wrapperProps = useBlockProps.save({
            className: 'geo-popup-overlay'
        });

        // Create props for the container
        const containerProps = {
            className: 'geo-popup-container',
            style: popupStyle,
            'data-trigger': triggerType,
            'data-delay': triggerDelay,
        };

        return (
            <div {...wrapperProps}>
                <div {...containerProps}>
                    <button className="geo-popup-close" aria-label="Close popup">×</button>
                    <InnerBlocks.Content />
                </div>
            </div>
        );
    },
});
