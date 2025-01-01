import { registerBlockType } from "@wordpress/blocks";
import {
  InnerBlocks,
  InspectorControls,
  useBlockProps,
} from "@wordpress/block-editor";
import {
  PanelBody,
  SelectControl,
  TextControl,
  Button,
  Card,
  CardHeader,
  CardBody,
  Flex,
  FlexItem,
} from "@wordpress/components";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import metadata from "./block.json";
import "./geo-content.css";

const locationTypes = {
  continent: "Continent",
  country: "Country",
  region: "State/Province",
  city: "City",
  ip: "IP Range"
};

const continents = [
  { label: "Africa", value: "AF" },
  { label: "Antarctica", value: "AN" },
  { label: "Asia", value: "AS" },
  { label: "Europe", value: "EU" },
  { label: "North America", value: "NA" },
  { label: "Oceania", value: "OC" },
  { label: "South America", value: "SA" }
];

registerBlockType(metadata.name, {
  edit: ({ attributes, setAttributes }) => {
    const { geoRules = [] } = attributes;
    const blockProps = useBlockProps({
      className: "geo-target-block",
    });

    const addGeoRule = () => {
      setAttributes({
        geoRules: [...geoRules, {
          type: "country",
          value: "",
          action: "show"
        }],
      });
    };

    const updateGeoRule = (index, updates) => {
      const newRules = [...geoRules];
      newRules[index] = { ...newRules[index], ...updates };
      setAttributes({ geoRules: newRules });
    };

    const removeGeoRule = (index) => {
      setAttributes({
        geoRules: geoRules.filter((_, i) => i !== index),
      });
    };

    const renderRuleInput = (rule, index) => {
      switch (rule.type) {
        case 'continent':
          return (
            <SelectControl
              value={rule.value}
              options={continents}
              onChange={(value) => updateGeoRule(index, { value })}
            />
          );
        case 'ip':
          return (
            <TextControl
              placeholder="e.g. 192.168.1.0/24"
              value={rule.value}
              onChange={(value) => updateGeoRule(index, { value })}
            />
          );
        default:
          return (
            <TextControl
              placeholder={`Enter ${locationTypes[rule.type]}`}
              value={rule.value}
              onChange={(value) => updateGeoRule(index, { value })}
            />
          );
      }
    };

    return (
      <>
        <InspectorControls>
          <PanelBody title="Geo Targeting Rules" initialOpen={true}>
            <DragDropContext onDragEnd={(result) => {
              if (!result.destination) return;
              
              const newRules = Array.from(geoRules);
              const [reorderedRule] = newRules.splice(result.source.index, 1);
              newRules.splice(result.destination.index, 0, reorderedRule);
              
              setAttributes({ geoRules: newRules });
            }}>
              <Droppable droppableId="geo-rules">
                {(provided) => (
                  <div 
                    className="geo-rules-container"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {geoRules.map((rule, index) => (
                      <Draggable 
                        key={index} 
                        draggableId={`rule-${index}`} 
                        index={index}
                      >
                        {(provided) => (
                <Card 
                  className="geo-rule-card"
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                >
                  <CardHeader {...provided.dragHandleProps}>
                    <Flex align="center">
                      <FlexItem>⋮⋮ Rule {index + 1}</FlexItem>
                      <Button
                        isDestructive
                        isSmall
                        onClick={() => removeGeoRule(index)}
                      >
                        Remove
                      </Button>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <SelectControl
                      label="Action"
                      value={rule.action}
                      options={[
                        { label: "Show Content", value: "show" },
                        { label: "Hide Content", value: "hide" },
                      ]}
                      onChange={(action) => updateGeoRule(index, { action })}
                    />
                    <SelectControl
                      label="Location Type"
                      value={rule.type}
                      options={Object.entries(locationTypes).map(([value, label]) => ({
                        value,
                        label
                      }))}
                      onChange={(type) => updateGeoRule(index, { type, value: "" })}
                    />
                    {renderRuleInput(rule, index)}
                  </CardBody>
                </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    <Button
                variant="primary"
                className="geo-rule-add-button"
                onClick={addGeoRule}
              >
                Add Geo Rule
              </Button>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
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
