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
  ip: "IP Range"
};

export const continents = [
  { label: "Africa", value: "AF" },
  { label: "Antarctica", value: "AN" },
  { label: "Asia", value: "AS" },
  { label: "Europe", value: "EU" },
  { label: "North America", value: "NA" },
  { label: "Oceania", value: "OC" },
  { label: "South America", value: "SA" }
];

export function GeoRules({ rules, onChange }) {
  const addRule = () => {
    onChange([...rules, {
      type: "country",
      value: "",
      action: "show"
    }]);
  };

  const updateRule = (index, updates) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    onChange(newRules);
  };

  const removeRule = (index) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  const renderRuleInput = (rule, index) => {
    switch (rule.type) {
      case 'continent':
        return (
          <SelectControl
            value={rule.value}
            options={continents}
            onChange={(value) => updateRule(index, { value })}
          />
        );
      case 'ip':
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
    <DragDropContext onDragEnd={(result) => {
      if (!result.destination) return;
      
      const newRules = Array.from(rules);
      const [reorderedRule] = newRules.splice(result.source.index, 1);
      newRules.splice(result.destination.index, 0, reorderedRule);
      
      onChange(newRules);
    }}>
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
                        options={Object.entries(locationTypes).map(([value, label]) => ({
                          value,
                          label
                        }))}
                        onChange={(type) => updateRule(index, { type, value: "" })}
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
