import {
  SelectControl,
  TextControl,
  Button,
  Flex,
  ButtonGroup,
} from "@wordpress/components";
import { CountryDropdown } from "../location-dropdowns/country-dropdown";
import { RegionDropdown } from "../location-dropdowns/region-dropdown";
import { CityDropdown } from "../location-dropdowns/city-dropdown";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { GeoCondition } from "../../types/types";

interface GeoConditionEditorProps {
  conditions: GeoCondition[];
  operator: "AND" | "OR";
  onChange: (conditions: GeoCondition[], operator: "AND" | "OR") => void;
}

const locationTypes: { [key: string]: string } = {
  continent: "Continent",
  country: "Country",
  region: "State/Province",
  city: "City",
  ip: "IP Range",
};

const continents = [
  { label: "Africa", value: "AF" },
  { label: "Antarctica", value: "AN" },
  { label: "Asia", value: "AS" },
  { label: "Europe", value: "EU" },
  { label: "North America", value: "NA" },
  { label: "Oceania", value: "OC" },
  { label: "South America", value: "SA" },
];

export const GeoConditionEditor: React.FC<GeoConditionEditorProps> = ({
  conditions,
  operator,
  onChange,
}) => {
  const addCondition = () => {
    const newConditions: GeoCondition[] = [
      ...conditions,
      { type: "country", value: "", operator: "is" },
    ];
    onChange(newConditions, operator);
  };

  const updateCondition = (index: number, updates: Partial<GeoCondition>) => {
    const newConditions = conditions.map((condition, i) =>
      i === index ? { ...condition, ...updates } : condition,
    );
    onChange(newConditions, operator);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index);
    onChange(newConditions, operator);
  };

  const reorderConditions = (startIndex: number, endIndex: number) => {
    const newConditions = [...conditions];
    const [removed] = newConditions.splice(startIndex, 1);
    newConditions.splice(endIndex, 0, removed);
    onChange(newConditions, operator);
  };

  const renderConditionInput = (condition: GeoCondition, index: number) => {
    switch (condition.type) {
      case "continent":
        return (
          <SelectControl
            className="mgeo-geo-rule-select"
            __nextHasNoMarginBottom={true}
            value={condition.value}
            options={continents}
            onChange={(value) => updateCondition(index, { value })}
          />
        );
      case "ip":
        return (
          <TextControl
            className="mgeo-geo-rule-select"
            __nextHasNoMarginBottom={true}
            placeholder="e.g. 192.168.1.0/24"
            value={condition.value}
            onChange={(value) => updateCondition(index, { value })}
          />
        );
      case "country":
        return (
          <CountryDropdown
            value={condition.value}
            onChange={(value) => updateCondition(index, { value })}
          />
        );
      case "region":
        return (
          <RegionDropdown
            value={condition.value}
            onChange={(value) => updateCondition(index, { value })}
          />
        );
      case "city":
        return (
          <CityDropdown
            value={condition.value}
            onChange={(value) => updateCondition(index, { value })}
          />
        );
      default:
        return (
          <TextControl
            className="mgeo-geo-rule-select"
            __nextHasNoMarginBottom={true}
            placeholder={`Enter ${locationTypes[condition.type]}`}
            value={condition.value}
            onChange={(value) => updateCondition(index, { value })}
          />
        );
    }
  };

  return (
    <div className="geo-conditions">
      <DragDropContext
        onDragEnd={(result: DropResult) => {
          if (!result.destination) return;
          reorderConditions(result.source.index, result.destination.index);
        }}
      >
        <Droppable droppableId="conditions">
          {(provided) => (
            <div
              className="geo-rule-conditions"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {conditions.map((condition, index) => (
                <>
                  {index > 0 && (
                    <div style={{ textAlign: "center", margin: "-9px 0" }}>
                      <ButtonGroup>
                        <Button
                          variant={
                            operator === "AND" ? "primary" : "secondary"
                          }
                          onClick={() => onChange(conditions, "AND")}
                          size="small"
                        >
                          and
                        </Button>
                        <Button
                          variant={
                            operator === "OR" ? "primary" : "secondary"
                          }
                          onClick={() => onChange(conditions, "OR")}
                          size="small"
                        >
                          or
                        </Button>
                      </ButtonGroup>
                    </div>
                  )}
                  <Draggable
                    key={index}
                    draggableId={`condition-${index}`}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="geo-condition"
                      >
                        <Flex align="center" gap={2}>
                          <div
                            className="mgeo-geo-condition-grabber"
                            {...provided.dragHandleProps}
                          >
                            ⋮⋮
                          </div>
                          <span>When </span>
                          <SelectControl
                            className="mgeo-geo-rule-select"
                            __nextHasNoMarginBottom={true}
                            value={condition.type}
                            options={Object.entries(locationTypes).map(
                              ([value, label]) => ({
                                value,
                                label,
                              }),
                            )}
                            onChange={(type) =>
                              updateCondition(index, {
                                type: type as GeoCondition["type"],
                                value: "",
                              })
                            }
                          />
                          <SelectControl
                            className="mgeo-geo-rule-select"
                            __nextHasNoMarginBottom={true}
                            value={condition.operator}
                            options={[
                              { value: "is", label: "is" },
                              { value: "is not", label: "is not" },
                            ]}
                            onChange={(operator) =>
                              updateCondition(index, {
                                operator: operator as GeoCondition["operator"],
                              })
                            }
                          />
                          {renderConditionInput(condition, index)}
                          <Button
                            isDestructive
                            onClick={() => removeCondition(index)}
                            disabled={conditions.length === 1}
                          >
                            Remove
                          </Button>
                        </Flex>
                      </div>
                    )}
                  </Draggable>
                </>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <Button
        variant="secondary"
        isSmall
        className="add-condition-button" onClick={addCondition}>
        Add Condition
      </Button>
    </div>
  );
};
