import {
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
import "./style.css";

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

export function GeoRules({ rules, onChange }) {
  const addRule = () => {
    onChange([
      ...rules,
      {
        conditions: [{
          type: "country",
          value: ""
        }],
        operator: "AND",
        action: "show"
      },
    ]);
  };

  const updateRule = (ruleIndex, updates) => {
    const newRules = [...rules];
    newRules[ruleIndex] = { ...newRules[ruleIndex], ...updates };
    onChange(newRules);
  };

  const addCondition = (ruleIndex) => {
    const newRules = [...rules];
    newRules[ruleIndex].conditions.push({
      type: "country",
      value: ""
    });
    onChange(newRules);
  };

  const updateCondition = (ruleIndex, conditionIndex, updates) => {
    const newRules = [...rules];
    newRules[ruleIndex].conditions[conditionIndex] = {
      ...newRules[ruleIndex].conditions[conditionIndex],
      ...updates
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

  const renderConditionInput = (rule, ruleIndex, condition, conditionIndex) => {
    switch (condition.type) {
      case "continent":
        return (
          <SelectControl
            value={condition.value}
            options={continents}
            onChange={(value) => updateCondition(ruleIndex, conditionIndex, { value })}
          />
        );
      case "ip":
        return (
          <TextControl
            placeholder="e.g. 192.168.1.0/24"
            value={rule.value}
            onChange={(value) => updateRule(index, { value })}
          />
        );
      default:
        return (
          <TextControl
            placeholder={`Enter ${locationTypes[rule.type]}`}
            value={rule.value}
            onChange={(value) => updateRule(index, { value })}
          />
        );
    }
  };

  return (
    <DragDropContext
      onDragEnd={(result) => {
        if (!result.destination) return;

        const newRules = Array.from(rules);
        const [reorderedRule] = newRules.splice(result.source.index, 1);
        newRules.splice(result.destination.index, 0, reorderedRule);

        onChange(newRules);
      }}
    >
      <Droppable droppableId="geo-rules">
        {(provided) => (
          <div
            className="geo-rules-container"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {rules.map((rule, index) => (
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
                          onClick={() => removeRule(index)}
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
                        onChange={(action) => updateRule(index, { action })}
                      />
                      <SelectControl
                        label="Location Type"
                        value={rule.type}
                        options={Object.entries(locationTypes).map(
                          ([value, label]) => ({
                            value,
                            label,
                          })
                        )}
                        onChange={(type) =>
                          updateRule(index, { type, value: "" })
                        }
                      />
                      <SelectControl
                        label="Action"
                        value={rule.action}
                        options={[
                          { label: "Show Content", value: "show" },
                          { label: "Hide Content", value: "hide" },
                        ]}
                        onChange={(action) => updateRule(index, { action })}
                      />
                      <SelectControl
                        label="Operator"
                        value={rule.operator}
                        options={[
                          { label: "Match ALL conditions (AND)", value: "AND" },
                          { label: "Match ANY condition (OR)", value: "OR" },
                        ]}
                        onChange={(operator) => updateRule(index, { operator })}
                      />
                      <div className="geo-rule-conditions">
                        {rule.conditions.map((condition, conditionIndex) => (
                          <div key={conditionIndex} className="geo-condition">
                            <SelectControl
                              label="Location Type"
                              value={condition.type}
                              options={Object.entries(locationTypes).map(
                                ([value, label]) => ({
                                  value,
                                  label,
                                })
                              )}
                              onChange={(type) => updateCondition(index, conditionIndex, { type, value: "" })}
                            />
                            {renderConditionInput(rule, index, condition, conditionIndex)}
                            <Button 
                              isDestructive 
                              isSmall
                              onClick={() => removeCondition(index, conditionIndex)}
                              disabled={rule.conditions.length === 1}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button 
                          variant="secondary"
                          isSmall
                          onClick={() => addCondition(index)}
                        >
                          Add Condition
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            <Button
              variant="primary"
              className="geo-rule-add-button"
              onClick={addRule}
            >
              Add Geo Rule
            </Button>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
