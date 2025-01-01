import { registerBlockType } from '@wordpress/blocks';
import {
    useBlockProps,
    RichText,
    InspectorControls,
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
            popupContent,
            popupTitle,
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
                    <div className="geo-popup-editor__section">
                        <div className="geo-popup-editor__section-title">Popup Content</div>
                        <TextControl
                            label="Popup Title"
                            value={popupTitle}
                            onChange={(value) => setAttributes({ popupTitle: value })}
                        />
                        <RichText
                            tagName="div"
                            value={popupContent}
                            onChange={(value) => setAttributes({ popupContent: value })}
                            placeholder="Enter popup content..."
                        />
                    </div>

                    <div className="geo-popup-preview" style={popupStyle}>
                        <h3>{popupTitle || 'Popup Title'}</h3>
                        <div dangerouslySetInnerHTML={{ __html: popupContent }} />
                    </div>
                </div>
            </>
        );
    },

    save: ({ attributes }) => {
        const {
            popupContent,
            popupTitle,
            popupStyle,
            triggerType,
            triggerDelay,
        } = attributes;

        const blockProps = useBlockProps.save({
            className: 'geo-popup-container',
            style: popupStyle,
            'data-trigger': triggerType,
            'data-delay': triggerDelay,
        });

        return (
            <div {...blockProps}>
                <button className="geo-popup-close" aria-label="Close popup">×</button>
                {popupTitle && <h3 className="geo-popup-title">{popupTitle}</h3>}
                <div dangerouslySetInnerHTML={{ __html: popupContent }} />
            </div>
        );
    },
});
