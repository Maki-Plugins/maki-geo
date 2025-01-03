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
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { FC } from "react";
import { GeoRule, GlobalRule } from "../../types";

interface GeoRuleEditorProps {
  rule: GlobalRule;
  onChange: (rule: GlobalRule) => void;
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
    const newRule = {
      ...rule,
      conditions: [
        ...rule.conditions,
        {
          type: "country",
          value: "",
        },
      ],
    };
    onChange(newRule);
  };

  const updateCondition = (
    conditionIndex: number,
    updates: Partial<GeoRule["conditions"][0]>
  ) => {
    const newRule = {
      ...rule,
      conditions: rule.conditions.map((condition, i) =>
        i === conditionIndex ? { ...condition, ...updates } : condition
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
    conditionIndex: number
  ) => {
    switch (condition.type) {
      case "continent":
        return (
          <SelectControl
            value={condition.value}
            options={continents}
            onChange={(value) => updateCondition(conditionIndex, { value })}
          />
        );
      case "ip":
        return (
          <TextControl
            placeholder="e.g. 192.168.1.0/24"
            value={condition.value}
            onChange={(value) => updateCondition(conditionIndex, { value })}
          />
        );
      default:
        return (
          <TextControl
            placeholder={`Enter ${locationTypes[condition.type]}`}
            value={condition.value}
            onChange={(value) => updateCondition(conditionIndex, { value })}
          />
        );
    }
  };

  return (
    <Card className="geo-rule-card">
      <CardHeader>
        <Flex align="center" justify="space-between">
          {showName && (
            <TextControl
              value={rule.name}
              onChange={(name) => onChange({ ...rule, name })}
              placeholder="Rule Name"
            />
          )}
        </Flex>
      </CardHeader>
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
        <SelectControl
          label="Operator"
          value={rule.operator}
          options={[
            { label: "Match ALL conditions (AND)", value: "AND" },
            { label: "Match ANY condition (OR)", value: "OR" },
          ]}
          onChange={(operator) => onChange({ ...rule, operator })}
        />

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
                            updateCondition(conditionIndex, {
                              type,
                              value: "",
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
          onClick={addCondition}
          className="add-condition-button"
        >
          Add Condition
        </Button>
      </CardBody>
    </Card>
  );
};
