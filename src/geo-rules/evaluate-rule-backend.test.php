<?php
/**
 * Test cases for geo rule evaluation
 *
 * @package Maki_Geo
 */

class TestEvaluateRuleBackend extends WP_UnitTestCase
{
    private $mockLocationData;

    public function setUp(): void
    {
        parent::setUp();
        $this->mockLocationData = [
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "California",
            "city" => "San Francisco",
            "ip" => "192.168.1.1",
        ];
    }

    public function test_should_return_action_when_no_conditions()
    {
        $rule = [
            "conditions" => [],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule, $this->mockLocationData)
        );

        $rule2 = [
            "conditions" => [],
            "operator" => "AND",
            "action" => "hide",
        ];
        $this->assertFalse(
            mgeo_evaluate_geo_content($rule2, $this->mockLocationData)
        );
    }

    public function test_should_evaluate_single_is_condition()
    {
        $rule = [
            "conditions" => [
                [
                    "type" => "country",
                    "operator" => "is",
                    "value" => "United States",
                ],
            ],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule, $this->mockLocationData)
        );
    }

    public function test_should_evaluate_single_is_not_condition()
    {
        $rule = [
            "conditions" => [
                [
                    "type" => "country",
                    "operator" => "is not",
                    "value" => "Canada",
                ],
            ],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule, $this->mockLocationData)
        );
    }

    public function test_should_handle_multiple_conditions_with_and_operator()
    {
        $rule = [
            "conditions" => [
                [
                    "type" => "country",
                    "operator" => "is",
                    "value" => "United States",
                ],
                [
                    "type" => "region",
                    "operator" => "is",
                    "value" => "California",
                ],
            ],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule, $this->mockLocationData)
        );
    }

    public function test_should_handle_multiple_conditions_with_or_operator()
    {
        $rule = [
            "conditions" => [
                ["type" => "country", "operator" => "is", "value" => "Canada"],
                [
                    "type" => "region",
                    "operator" => "is",
                    "value" => "California",
                ],
            ],
            "operator" => "OR",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule, $this->mockLocationData)
        );
    }

    public function test_should_handle_hide_action()
    {
        $rule = [
            "conditions" => [
                [
                    "type" => "country",
                    "operator" => "is",
                    "value" => "United States",
                ],
            ],
            "operator" => "AND",
            "action" => "hide",
        ];
        $this->assertFalse(
            mgeo_evaluate_geo_content($rule, $this->mockLocationData)
        );
    }

    public function test_should_handle_case_insensitive_comparisons()
    {
        $rule = [
            "conditions" => [
                [
                    "type" => "country",
                    "operator" => "is",
                    "value" => "UNITED STATES",
                ],
                [
                    "type" => "city",
                    "operator" => "is",
                    "value" => "san francisco",
                ],
            ],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule, $this->mockLocationData)
        );
    }

    public function test_should_handle_complex_and_or_combinations()
    {
        $rule = [
            "conditions" => [
                [
                    "type" => "country",
                    "operator" => "is",
                    "value" => "United States",
                ],
                [
                    "type" => "region",
                    "operator" => "is not",
                    "value" => "Texas",
                ],
                [
                    "type" => "city",
                    "operator" => "is",
                    "value" => "San Francisco",
                ],
            ],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule, $this->mockLocationData)
        );

        $rule2 = [
            "conditions" => [
                ["type" => "country", "operator" => "is", "value" => "Canada"],
                [
                    "type" => "region",
                    "operator" => "is",
                    "value" => "California",
                ],
                ["type" => "city", "operator" => "is", "value" => "Vancouver"],
            ],
            "operator" => "OR",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule2, $this->mockLocationData)
        );
    }

    public function test_should_handle_ip_address_conditions()
    {
        $rule = [
            "conditions" => [
                ["type" => "ip", "operator" => "is", "value" => "192.168.1.1"],
            ],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule, $this->mockLocationData)
        );

        $rule2 = [
            "conditions" => [
                ["type" => "ip", "operator" => "is not", "value" => "10.0.0.1"],
            ],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule2, $this->mockLocationData)
        );
    }

    public function test_should_handle_country_code_matches()
    {
        // Test with full country name
        $rule = [
            "conditions" => [
                [
                    "type" => "country",
                    "operator" => "is",
                    "value" => "United States",
                ],
            ],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule, $this->mockLocationData)
        );

        // Test with country code
        $rule2 = [
            "conditions" => [
                ["type" => "country", "operator" => "is", "value" => "us"],
            ],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule2, $this->mockLocationData)
        );

        // Test with "is not" operator
        $rule3 = [
            "conditions" => [
                ["type" => "country", "operator" => "is not", "value" => "CA"],
            ],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule3, $this->mockLocationData)
        );
    }

    public function test_should_handle_opposite_actions_when_conditions_not_met()
    {
        $rule = [
            "conditions" => [
                ["type" => "country", "operator" => "is", "value" => "Canada"],
            ],
            "operator" => "AND",
            "action" => "show",
        ];
        $this->assertFalse(
            mgeo_evaluate_geo_content($rule, $this->mockLocationData)
        );

        $rule2 = [
            "conditions" => [
                ["type" => "country", "operator" => "is", "value" => "Canada"],
            ],
            "operator" => "AND",
            "action" => "hide",
        ];
        $this->assertTrue(
            mgeo_evaluate_geo_content($rule2, $this->mockLocationData)
        );
    }
}
