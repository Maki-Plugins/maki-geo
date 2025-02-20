import {
  TextControl,
  Button,
  Card,
  CardHeader,
  CardBody,
  Flex,
  ButtonGroup,
  Dashicon,
} from "@wordpress/components";
import { FC } from "react";
import { GeoRule, GeoRuleBase } from "../../types/types";
import { GeoConditionEditor } from "../geo-condition-editor/geo-condition-editor";

interface GeoRuleEditorProps {
  rule: GeoRule;
  onChange: (rule: GeoRule) => void;
  showName?: boolean;
}

export const GeoRuleEditor: FC<GeoRuleEditorProps> = ({
  rule,
  onChange,
  showName = false,
}) => {
  const updateConditions = (
    conditions: GeoRuleBase["conditions"],
    operator: GeoRuleBase["operator"],
  ) => {
    const newRule = {
      ...rule,
      conditions,
      operator,
    };
    onChange(newRule);
  };

  return (
    <Card className="geo-rule-card">
      <CardHeader>
        <Flex
          className="geo-rule-card-header"
          direction="column"
          align="stretch"
          justify="space-between"
        >
          {showName && rule.ruleType === "global" && (
            <>
              <label>Name</label>
              <TextControl
                value={rule.name}
                onChange={(name) => onChange({ ...rule, name })}
                placeholder="Rule Name"
              />
            </>
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

        <label>Conditions</label>

        <GeoConditionEditor
          conditions={rule.conditions}
          operator={rule.operator}
          onChange={(conditions, operator) =>
            updateConditions(conditions, operator)
          }
        />
      </CardBody>
    </Card>
  );
};
