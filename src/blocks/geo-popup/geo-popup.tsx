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

interface PopupStyle {
    width: string;
    height: string;
    backgroundColor: string;
    borderRadius: string;
}

interface PopupAttributes {
    geoRules: any[];
    popupStyle: PopupStyle;
    triggerType: 'immediate' | 'delayed' | 'exit';
    triggerDelay: number;
}

interface EditProps {
    attributes: PopupAttributes;
    setAttributes: (attributes: Partial<PopupAttributes>) => void;
}

interface SaveProps {
    attributes: PopupAttributes;
}

registerBlockType<PopupAttributes>(metadata.name, {
    edit: ({ attributes, setAttributes }: EditProps) => {
        const {
            geoRules = [],
            popupStyle,
            triggerType,
            triggerDelay,
        } = attributes;

        const blockProps = useBlockProps({
            className: 'geo-popup-editor'
        });

        const updateStyle = (property: keyof PopupStyle, value: string) => {
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
                            onChange={(value: 'immediate' | 'delayed' | 'exit') => 
                                setAttributes({ triggerType: value })}
                        />
                        {triggerType === 'delayed' && (
                            <TextControl
                                type="number"
                                label="Delay (seconds)"
                                value={triggerDelay}
                                onChange={(value: string) => 
                                    setAttributes({ triggerDelay: parseInt(value) || 0 })}
                                min="0"
                            />
                        )}
                        <SelectControl
                            label="Width"
                            value={popupStyle.width}
                            options={[
                                { label: 'Small (400px)', value: '400px' },
                                { label: 'Medium (600px)', value: '600px' },
                                { label: 'Large (800px)', value: '800px' },
                                { label: 'Full Width (90%)', value: '90%' },
                            ]}
                            onChange={(value: string) => updateStyle('width', value)}
                        />
                        <div>
                            <label>Background Color</label>
                            <ColorPicker
                                color={popupStyle.backgroundColor}
                                onChange={(value: string) => updateStyle('backgroundColor', value)}
                            />
                        </div>
                        <RangeControl
                            label="Border Radius (px)"
                            value={parseInt(popupStyle.borderRadius)}
                            onChange={(value: number | undefined) => 
                                value !== undefined && updateStyle('borderRadius', `${value}px`)}
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
        const {
            popupStyle,
            triggerType,
            triggerDelay,
        } = attributes;

        const wrapperProps = useBlockProps.save({
            className: 'geo-popup-overlay'
        });

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
