<?php
/**
 * Test cases for geo rule evaluation
 *
 * @package Maki_Geo
 */

class TestMaki extends WP_UnitTestCase {
    private $mockLocationData;

    public function setUp(): void {
        parent::setUp();
        $this->mockLocationData = array(
            'continent' => 'North America',
            'country' => 'United States',
            'region' => 'California',
            'city' => 'San Francisco',
            'ip' => '192.168.1.1'
        );
    }

    public function test_should_return_action_when_no_conditions() {
        $rule = array(
            'conditions' => array(),
            'operator' => 'AND',
            'action' => 'show'
        );
        $this->assertTrue(mgeo_evaluate_rule($rule, $this->mockLocationData));

        $rule2 = array(
            'conditions' => array(),
            'operator' => 'AND',
            'action' => 'hide'
        );
        $this->assertFalse(mgeo_evaluate_rule($rule2, $this->mockLocationData));
    }

    public function test_should_evaluate_single_is_condition() {
        $rule = array(
            'conditions' => array(
                array('type' => 'country', 'operator' => 'is', 'value' => 'United States')
            ),
            'operator' => 'AND',
            'action' => 'show'
        );
        $this->assertTrue(mgeo_evaluate_rule($rule, $this->mockLocationData));
    }

    public function test_should_evaluate_single_is_not_condition() {
        $rule = array(
            'conditions' => array(
                array('type' => 'country', 'operator' => 'is not', 'value' => 'Canada')
            ),
            'operator' => 'AND',
            'action' => 'show'
        );
        $this->assertTrue(mgeo_evaluate_rule($rule, $this->mockLocationData));
    }

    public function test_should_handle_multiple_conditions_with_and_operator() {
        $rule = array(
            'conditions' => array(
                array('type' => 'country', 'operator' => 'is', 'value' => 'United States'),
                array('type' => 'region', 'operator' => 'is', 'value' => 'California')
            ),
            'operator' => 'AND',
            'action' => 'show'
        );
        $this->assertTrue(mgeo_evaluate_rule($rule, $this->mockLocationData));
    }

    public function test_should_handle_multiple_conditions_with_or_operator() {
        $rule = array(
            'conditions' => array(
                array('type' => 'country', 'operator' => 'is', 'value' => 'Canada'),
                array('type' => 'region', 'operator' => 'is', 'value' => 'California')
            ),
            'operator' => 'OR',
            'action' => 'show'
        );
        $this->assertTrue(mgeo_evaluate_rule($rule, $this->mockLocationData));
    }

    public function test_should_handle_hide_action() {
        $rule = array(
            'conditions' => array(
                array('type' => 'country', 'operator' => 'is', 'value' => 'United States')
            ),
            'operator' => 'AND',
            'action' => 'hide'
        );
        $this->assertFalse(mgeo_evaluate_rule($rule, $this->mockLocationData));
    }

    public function test_should_handle_case_insensitive_comparisons() {
        $rule = array(
            'conditions' => array(
                array('type' => 'country', 'operator' => 'is', 'value' => 'UNITED STATES'),
                array('type' => 'city', 'operator' => 'is', 'value' => 'san francisco')
            ),
            'operator' => 'AND',
            'action' => 'show'
        );
        $this->assertTrue(mgeo_evaluate_rule($rule, $this->mockLocationData));
    }

    public function test_should_handle_complex_and_or_combinations() {
        $rule = array(
            'conditions' => array(
                array('type' => 'country', 'operator' => 'is', 'value' => 'United States'),
                array('type' => 'region', 'operator' => 'is not', 'value' => 'Texas'),
                array('type' => 'city', 'operator' => 'is', 'value' => 'San Francisco')
            ),
            'operator' => 'AND',
            'action' => 'show'
        );
        $this->assertTrue(mgeo_evaluate_rule($rule, $this->mockLocationData));

        $rule2 = array(
            'conditions' => array(
                array('type' => 'country', 'operator' => 'is', 'value' => 'Canada'),
                array('type' => 'region', 'operator' => 'is', 'value' => 'California'),
                array('type' => 'city', 'operator' => 'is', 'value' => 'Vancouver')
            ),
            'operator' => 'OR',
            'action' => 'show'
        );
        $this->assertTrue(mgeo_evaluate_rule($rule2, $this->mockLocationData));
    }

    public function test_should_handle_ip_address_conditions() {
        $rule = array(
            'conditions' => array(
                array('type' => 'ip', 'operator' => 'is', 'value' => '192.168.1.1')
            ),
            'operator' => 'AND',
            'action' => 'show'
        );
        $this->assertTrue(mgeo_evaluate_rule($rule, $this->mockLocationData));

        $rule2 = array(
            'conditions' => array(
                array('type' => 'ip', 'operator' => 'is not', 'value' => '10.0.0.1')
            ),
            'operator' => 'AND',
            'action' => 'show'
        );
        $this->assertTrue(mgeo_evaluate_rule($rule2, $this->mockLocationData));
    }

    public function test_should_handle_opposite_actions_when_conditions_not_met() {
        $rule = array(
            'conditions' => array(
                array('type' => 'country', 'operator' => 'is', 'value' => 'Canada')
            ),
            'operator' => 'AND',
            'action' => 'show'
        );
        $this->assertFalse(mgeo_evaluate_rule($rule, $this->mockLocationData));

        $rule2 = array(
            'conditions' => array(
                array('type' => 'country', 'operator' => 'is', 'value' => 'Canada')
            ),
            'operator' => 'AND',
            'action' => 'hide'
        );
        $this->assertTrue(mgeo_evaluate_rule($rule2, $this->mockLocationData));
    }
}
