<?php

require_once('utils.php');

add_action('rest_api_init', function () {
    register_rest_route('geoutils/v1', '/rules', array(
        array(
            'methods' => 'GET',
            'callback' => 'get_geo_rules',
            'permission_callback' => 'is_user_logged_in',
        ),
        array(
            'methods' => 'POST',
            'callback' => 'create_geo_rule',
            'permission_callback' => 'is_user_logged_in',
        ),
        array(
            'methods' => 'PUT',
            'callback' => 'update_geo_rule',
            'permission_callback' => 'is_user_logged_in',
        ),
        array(
            'methods' => 'DELETE',
            'callback' => 'delete_geo_rule',
            'permission_callback' => 'is_user_logged_in',
        )
    ));
});

function get_geo_rules() {
    verify_nonce();
    return get_option('geoutils_rules', array());
}

function create_geo_rule($request) {
    verify_nonce();
    $rule = json_decode($request->get_body(), true);
    
    if (!validate_rule($rule)) {
        return new WP_Error('invalid_rule', 'Invalid rule format', array('status' => 400));
    }

    $rules = get_option('geoutils_rules', array());
    $rules[] = $rule;
    update_option('geoutils_rules', $rules);
    
    return array('success' => true, 'rule' => $rule);
}

function update_geo_rule($request) {
    verify_nonce();
    $rule = json_decode($request->get_body(), true);
    $index = isset($_GET['index']) ? intval($_GET['index']) : -1;
    
    if ($index < 0 || !validate_rule($rule)) {
        return new WP_Error('invalid_request', 'Invalid request', array('status' => 400));
    }

    $rules = get_option('geoutils_rules', array());
    if (!isset($rules[$index])) {
        return new WP_Error('not_found', 'Rule not found', array('status' => 404));
    }

    $rules[$index] = $rule;
    update_option('geoutils_rules', $rules);
    
    return array('success' => true, 'rule' => $rule);
}

function delete_geo_rule($request) {
    verify_nonce();
    $index = isset($_GET['index']) ? intval($_GET['index']) : -1;
    
    if ($index < 0) {
        return new WP_Error('invalid_request', 'Invalid index', array('status' => 400));
    }

    $rules = get_option('geoutils_rules', array());
    if (!isset($rules[$index])) {
        return new WP_Error('not_found', 'Rule not found', array('status' => 404));
    }

    array_splice($rules, $index, 1);
    update_option('geoutils_rules', $rules);
    
    return array('success' => true);
}

function validate_rule($rule) {
    // Validate basic rule structure
    if (!isset($rule['conditions']) || !is_array($rule['conditions'])) {
        return false;
    }

    // Allow empty conditions array for new rules
    if (empty($rule['conditions'])) {
        return true;
    }

    // Validate action if present
    if (isset($rule['action']) && !in_array($rule['action'], array('show', 'hide'))) {
        return false;
    }

    // Validate each condition
    foreach ($rule['conditions'] as $condition) {
        if (!isset($condition['type']) || !isset($condition['value'])) {
            return false;
        }
    }

    return true;
}
