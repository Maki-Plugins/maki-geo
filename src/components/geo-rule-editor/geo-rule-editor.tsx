import {
  SelectControl,
  TextControl,
  Button,
  Card,
  CardHeader,
  CardBody,
  Flex,
  ButtonGroup,
  Dashicon,
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
import { FC } from "react";
import { GeoCondition, GeoRule } from "../../types/types";

interface GeoRuleEditorProps {
  rule: GeoRule;
  onChange: (rule: GeoRule) => void;
  showName?: boolean;
}

interface LocationType {
  [key: string]: string;
}

export const locationTypes: LocationType = {
  continent: "Continent",
  country: "Country",
  region: "State/Province",
  city: "City",
  ip: "IP Range",
};

export const continents = [
  { label: "Africa", value: "AF" },
  { label: "Antarctica", value: "AN" },
  { label: "Asia", value: "AS" },
  { label: "Europe", value: "EU" },
  { label: "North America", value: "NA" },
  { label: "Oceania", value: "OC" },
  { label: "South America", value: "SA" },
];

export const GeoRuleEditor: FC<GeoRuleEditorProps> = ({
  rule,
  onChange,
  showName = false,
}) => {
  const addCondition = () => {
    const newRule: GeoRule = {
      ...rule,
      conditions: [
        ...rule.conditions,
        {
          type: "country",
          value: "",
          operator: "is",
        },
      ],
    };
    onChange(newRule);
  };

  const updateCondition = (
    conditionIndex: number,
    updates: Partial<GeoRule["conditions"][0]>,
  ) => {
    const newRule = {
      ...rule,
      conditions: rule.conditions.map((condition, i) =>
        i === conditionIndex ? { ...condition, ...updates } : condition,
      ),
    };
    onChange(newRule);
  };

  const removeCondition = (conditionIndex: number) => {
    const newRule = {
      ...rule,
      conditions: rule.conditions.filter((_, i) => i !== conditionIndex),
    };
    onChange(newRule);
  };

  const reorderConditions = (startIndex: number, endIndex: number) => {
    const newConditions = [...rule.conditions];
    const [removed] = newConditions.splice(startIndex, 1);
    newConditions.splice(endIndex, 0, removed);
    onChange({ ...rule, conditions: newConditions });
  };

  const renderConditionInput = (
    condition: GeoRule["conditions"][0],
    conditionIndex: number,
  ) => {
    switch (condition.type) {
      case "continent":
        return (
          <SelectControl
            className="mgeo-geo-rule-select"
            __nextHasNoMarginBottom={true}
            value={condition.value}
            options={continents}
            onChange={(value) => updateCondition(conditionIndex, { value })}
          />
        );
      case "ip":
        return (
          <TextControl
            className="mgeo-geo-rule-select"
            __nextHasNoMarginBottom={true}
            placeholder="e.g. 192.168.1.0/24"
            value={condition.value}
            onChange={(value) => updateCondition(conditionIndex, { value })}
          />
        );
      case "country":
        return (
          <CountryDropdown
            value={condition.value}
            onChange={(value) => updateCondition(conditionIndex, { value })}
          />
        );
      case "region":
        return (
          <RegionDropdown
            value={condition.value}
            onChange={(value) => updateCondition(conditionIndex, { value })}
          />
        );
      case "city":
        return (
          <CityDropdown
            value={condition.value}
            onChange={(value) => updateCondition(conditionIndex, { value })}
          />
        );
      default:
        return (
          <TextControl
            className="mgeo-geo-rule-select"
            __nextHasNoMarginBottom={true}
            placeholder={`Enter ${locationTypes[condition.type]}`}
            value={condition.value}
            onChange={(value) => updateCondition(conditionIndex, { value })}
          />
        );
    }
  };

  return (
    <Card className="geo-rule-card">
      <CardBody>
        <div className="visibility-toggle">
          <label>Content Visibility</label>
          <ButtonGroup>
            <Button
              variant={rule.action === "show" ? "primary" : "secondary"}
              onClick={() => onChange({ ...rule, action: "show" })}
            >
              <Dashicon icon="visibility" />
              Show
            </Button>
            <Button
              variant={rule.action === "hide" ? "primary" : "secondary"}
              onClick={() => onChange({ ...rule, action: "hide" })}
            >
              <Dashicon icon="hidden" />
              Hide
            </Button>
          </ButtonGroup>
        </div>

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
                {rule.conditions.map((condition, conditionIndex) => (
                  <>
                    {conditionIndex > 0 && (
                      <div style={{ textAlign: "center", margin: "-9px 0" }}>
                        <ButtonGroup>
                          <Button
                            variant={
                              rule.operator === "AND" ? "primary" : "secondary"
                            }
                            onClick={() =>
                              onChange({ ...rule, operator: "AND" })
                            }
                            size="small"
                          >
                            and
                          </Button>
                          <Button
                            variant={
                              rule.operator === "OR" ? "primary" : "secondary"
                            }
                            onClick={() =>
                              onChange({ ...rule, operator: "OR" })
                            }
                            size="small"
                          >
                            or
                          </Button>
                        </ButtonGroup>
                      </div>
                    )}
                    <Draggable
                      key={conditionIndex}
                      draggableId={`condition-${conditionIndex}`}
                      index={conditionIndex}
                    >
                      {(provided) => (
                        <div
                          className="geo-condition"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <Flex justify="inherit" gap={2}>
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
                              style={{ width: "160px" }}
                              options={Object.entries(locationTypes).map(
                                ([value, label]) => ({
                                  value,
                                  label,
                                }),
                              )}
                              onChange={(type) =>
                                updateCondition(conditionIndex, {
                                  type: type as GeoCondition["type"],
                                  value: "",
                                })
                              }
                            />
                            <SelectControl
                              className="mgeo-geo-rule-select"
                              __nextHasNoMarginBottom={true}
                              value={condition.operator || "is"}
                              style={{ width: "90px" }}
                              options={[
                                { value: "is", label: "is" },
                                { value: "is not", label: "is not" },
                              ]}
                              onChange={(operator) =>
                                updateCondition(conditionIndex, {
                                  operator:
                                    operator as GeoCondition["operator"],
                                })
                              }
                            />
                            {renderConditionInput(condition, conditionIndex)}
                            <Button
                              isDestructive
                              isSmall
                              onClick={() => removeCondition(conditionIndex)}
                              disabled={rule.conditions.length === 1}
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
          onClick={addCondition}
          className="add-condition-button"
        >
          Add Condition
        </Button>
      </CardBody>
    </Card>
  );
};
