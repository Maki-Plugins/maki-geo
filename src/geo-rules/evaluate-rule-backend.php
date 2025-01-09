<?php

if (!defined('ABSPATH')) {
    exit;
}

function mgeo_evaluate_rule($rule, $content)
{
    $location_data = mgeo_get_location_data();
    
    if (!$location_data) {
        return '';
    }

    // Evaluate conditions
    $results = array_map(
        function ($condition) use ($location_data) {
            $location_value = strtolower($location_data[$condition['type']]);
            $condition_value = strtolower($condition['value']);
        
            if ($condition['operator'] === 'is') {
                return $location_value === $condition_value;
            }
            return $location_value !== $condition_value;
        }, $rule['conditions']
    );

    // Combine results based on operator
    $final_result = $rule['operator'] === 'AND' 
        ? !in_array(false, $results, true)
        : in_array(true, $results, true);

    // Apply action
    if ($final_result) {
        return $rule['action'] === 'show' ? do_shortcode($content) : '';
    }
    
    return $rule['action'] === 'show' ? '' : do_shortcode($content);
}
