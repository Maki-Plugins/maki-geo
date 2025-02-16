<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action(
    'rest_api_init', function () {
        register_rest_route(
            'maki-geo/v1', '/rules', array(
            array(
                'methods' => 'GET',
                'callback' => 'mgeo_get_global_geo_rules',
                'permission_callback' => 'mgeo_can_manage_rules',
            ),
            array(
                'methods' => 'DELETE',
                'callback' => 'mgeo_delete_all_global_geo_rules',
                'permission_callback' => 'mgeo_can_manage_rules',
            ),
            array(
                'methods' => 'POST',
                'callback' => 'mgeo_create_global_geo_rule',
                'permission_callback' => 'mgeo_can_manage_rules',
            ),
            array(
                'methods' => 'PUT',
                'callback' => 'mgeo_update_global_geo_rule',
                'permission_callback' => 'mgeo_can_manage_rules',
            ),
            array(
                'methods' => 'DELETE',
                'callback' => 'mgeo_delete_global_geo_rule',
                'permission_callback' => 'mgeo_can_manage_rules',
            )
            )
        );
    }
);

function mgeo_get_global_geo_rules()
{
    mgeo_verify_nonce();
    return get_option('mgeo_geo_rules', array());
}

function mgeo_create_global_geo_rule($request)
{
    mgeo_verify_nonce();
    $new_rules = json_decode($request->get_body(), true);
    
    if (!is_array($new_rules)) {
        return new WP_Error('invalid_rules', 'Invalid rules format', array('status' => 400));
    }

    foreach ($new_rules as $rule) {
        if (!mgeo_validate_rule($rule)) {
            return new WP_Error('invalid_rule', 'Invalid rule format', array('status' => 400));
        }
    }

    update_option('mgeo_geo_rules', $new_rules);
    return array('success' => true, 'rules' => $new_rules);
}

function mgeo_update_global_geo_rule($request)
{
    mgeo_verify_nonce();
    $rule = json_decode($request->get_body(), true);
    $index = isset($_GET['index']) ? intval($_GET['index']) : -1;
    
    if ($index < 0 || !mgeo_validate_rule($rule)) {
        return new WP_Error('invalid_request', 'Invalid request', array('status' => 400));
    }

    $rules = get_option('mgeo_geo_rules', array());
    if (!isset($rules[$index])) {
        return new WP_Error('not_found', 'Rule not found', array('status' => 404));
    }

    $rules[$index] = $rule;
    update_option('mgeo_geo_rules', $rules);
    
    return array('success' => true, 'rule' => $rule);
}

function mgeo_delete_global_geo_rule($request)
{
    mgeo_verify_nonce();
    $index = isset($_GET['index']) ? intval($_GET['index']) : -1;
    
    if ($index < 0) {
        return new WP_Error('invalid_request', 'Invalid index', array('status' => 400));
    }

    $rules = get_option('mgeo_geo_rules', array());
    if (!isset($rules[$index])) {
        return new WP_Error('not_found', 'Rule not found', array('status' => 404));
    }

    array_splice($rules, $index, 1);
    update_option('mgeo_geo_rules', $rules);
    
    return array('success' => true);
}

function mgeo_delete_all_global_geo_rules()
{
    mgeo_verify_nonce();
    update_option('mgeo_geo_rules', array());
    return array('success' => true);
}

function mgeo_sanitize_geo_rules($rules) {
    if (!is_array($rules)) {
        return array();
    }

    return array_map(function($rule) {
        // Ensure required fields exist and are properly sanitized
        $sanitized_rule = array(
            'id' => isset($rule['id']) ? sanitize_key($rule['id']) : '',
            'name' => isset($rule['name']) ? sanitize_text_field($rule['name']) : '',
            'conditions' => array(),
            'operator' => isset($rule['operator']) && in_array($rule['operator'], array('AND', 'OR')) 
                ? $rule['operator'] 
                : 'AND',
            'action' => isset($rule['action']) && in_array($rule['action'], array('show', 'hide')) 
                ? $rule['action'] 
                : 'show',
            'ruleType' => 'global'
        );

        // Sanitize conditions
        if (isset($rule['conditions']) && is_array($rule['conditions'])) {
            $sanitized_rule['conditions'] = array_map(function($condition) {
                return array(
                    'type' => isset($condition['type']) && 
                             in_array($condition['type'], array('continent', 'country', 'region', 'city', 'ip'))
                        ? $condition['type']
                        : 'country',
                    'operator' => isset($condition['operator']) && 
                                 in_array($condition['operator'], array('is', 'is not'))
                        ? $condition['operator']
                        : 'is',
                    'value' => isset($condition['value']) 
                        ? sanitize_text_field($condition['value'])
                        : ''
                );
            }, $rule['conditions']);
        }

        return $sanitized_rule;
    }, $rules);
}

function mgeo_validate_rule($rule)
{
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
        if (!isset($condition['type']) || !isset($condition['value']) || !isset($condition['operator'])) {
            return false;
        }
        if (!in_array($condition['operator'], array('is', 'is not'))) {
            return false;
        }
    }

    return true;
}
