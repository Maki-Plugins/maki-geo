<?php

if (!defined('ABSPATH')) {
    exit;
}

function mgeo_evaluate_rule($rule, $location_data)
{
    if (empty($rule['conditions'])) {
        return $rule['action'] === 'show';
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

    // Return whether content should be shown
    return $final_result ? ($rule['action'] === 'show') : ($rule['action'] === 'hide');
}
