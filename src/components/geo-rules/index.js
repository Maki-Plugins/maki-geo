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
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export const locationTypes = {
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

export function GeoRules({ rules, onChange, isGlobal = false }) {
  const addRule = () => {
    const newRule = {
      id: Date.now().toString(),
      name: isGlobal ? `Rule ${rules.length + 1}` : undefined,
      conditions: [
        {
          type: "country",
          value: "",
        },
      ],
      operator: "AND",
      action: "show",
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (ruleIndex, updates) => {
    const newRules = [...rules];
    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      ...updates,
    };
    onChange(newRules);
  };

  const addCondition = (ruleIndex) => {
    const newRules = [...rules];
    newRules[ruleIndex].conditions.push({
      type: "country",
      value: "",
    });
    onChange(newRules);
  };

  const updateCondition = (ruleIndex, conditionIndex, updates) => {
    const newRules = [...rules];
    newRules[ruleIndex].conditions[conditionIndex] = {
      ...newRules[ruleIndex].conditions[conditionIndex],
      ...updates,
    };
    onChange(newRules);
  };

  const removeCondition = (ruleIndex, conditionIndex) => {
    const newRules = [...rules];
    newRules[ruleIndex].conditions.splice(conditionIndex, 1);
    onChange(newRules);
  };

  const removeRule = (index) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const reorderConditions = (ruleIndex, startIndex, endIndex) => {
    const newRules = [...rules];
    const [removed] = newRules[ruleIndex].conditions.splice(startIndex, 1);
    newRules[ruleIndex].conditions.splice(endIndex, 0, removed);
    onChange(newRules);
  };

  const renderConditionInput = (condition, ruleIndex, conditionIndex) => {
    switch (condition.type) {
      case "continent":
        return (
          <SelectControl
            value={condition.value}
            options={continents}
            onChange={(value) =>
              updateCondition(ruleIndex, conditionIndex, { value })
            }
          />
        );
      case "ip":
        return (
          <TextControl
            placeholder="e.g. 192.168.1.0/24"
            value={condition.value}
            onChange={(value) =>
              updateCondition(ruleIndex, conditionIndex, { value })
            }
          />
        );
      default:
        return (
          <TextControl
            placeholder={`Enter ${locationTypes[condition.type]}`}
            value={condition.value}
            onChange={(value) =>
              updateCondition(ruleIndex, conditionIndex, { value })
            }
          />
        );
    }
  };

  return (
    <div className="geo-rules-container">
      {rules.map((rule, ruleIndex) => (
        <Card key={ruleIndex} className="geo-rule-card">
          <CardHeader>
            <Flex align="center" justify="space-between">
              <TextControl
                value={rule.name}
                onChange={(name) => updateRule(ruleIndex, { name })}
              />
              <Button
                isDestructive
                isSmall
                onClick={() => removeRule(ruleIndex)}
              >
                Remove Rule
              </Button>
            </Flex>
          </CardHeader>
          <CardBody>
            <div className="visibility-toggle">
              <label>Content Visibility</label>
              <ButtonGroup>
                <Button
                  variant={rule.action === "show" ? "primary" : "secondary"}
                  onClick={() => updateRule(ruleIndex, { action: "show" })}
                >
                  <Dashicon icon="visibility" />
                  Show
                </Button>
                <Button
                  variant={rule.action === "hide" ? "primary" : "secondary"}
                  onClick={() => updateRule(ruleIndex, { action: "hide" })}
                >
                  <Dashicon icon="hidden" />
                  Hide
                </Button>
              </ButtonGroup>
            </div>
            <SelectControl
              label="Operator"
              value={rule.operator}
              options={[
                { label: "Match ALL conditions (AND)", value: "AND" },
                { label: "Match ANY condition (OR)", value: "OR" },
              ]}
              onChange={(operator) => updateRule(ruleIndex, { operator })}
            />

            <DragDropContext
              onDragEnd={(result) => {
                if (!result.destination) return;
                reorderConditions(
                  ruleIndex,
                  result.source.index,
                  result.destination.index
                );
              }}
            >
              <Droppable droppableId={`conditions-${ruleIndex}`}>
                {(provided) => (
                  <div
                    className="geo-rule-conditions"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {rule.conditions.map((condition, conditionIndex) => (
                      <Draggable
                        key={conditionIndex}
                        draggableId={`condition-${ruleIndex}-${conditionIndex}`}
                        index={conditionIndex}
                      >
                        {(provided) => (
                          <div
                            className="geo-condition"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <div {...provided.dragHandleProps}>⋮⋮</div>
                            <SelectControl
                              value={condition.type}
                              options={Object.entries(locationTypes).map(
                                ([value, label]) => ({
                                  value,
                                  label,
                                })
                              )}
                              onChange={(type) =>
                                updateCondition(ruleIndex, conditionIndex, {
                                  type,
                                  value: "",
                                })
                              }
                            />
                            {renderConditionInput(
                              condition,
                              ruleIndex,
                              conditionIndex
                            )}
                            <Button
                              isDestructive
                              isSmall
                              onClick={() =>
                                removeCondition(ruleIndex, conditionIndex)
                              }
                              disabled={rule.conditions.length === 1}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <Button
              variant="secondary"
              isSmall
              onClick={() => addCondition(ruleIndex)}
              className="add-condition-button"
            >
              Add Condition
            </Button>
          </CardBody>
        </Card>
      ))}

      <Button
        variant="primary"
        className="geo-rule-add-button"
        onClick={addRule}
      >
        Add Geo Rule
      </Button>
    </div>
  );
}
