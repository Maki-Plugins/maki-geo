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
            $location_value = trim(strtolower($location_data[$condition['type']]));
            $condition_value = trim(strtolower($condition['value']));
        
            if ($condition['operator'] === 'is') {
                // When checking for country, also check for country_code. Ie, you can write country='US' and it should still work
                if($condition['type'] === 'country') {
                    $location_country_code = trim(strtolower($location_data['country_code']));
                    return $location_value === $condition_value || $location_country_code === $condition_value;
                }
                return $location_value === $condition_value;
            }
            // Again, when checking for country, also check for country_code. Ie, you can write country='US' and it should still work
            if($condition['type'] === 'country') {
                $location_country_code = trim(strtolower($location_data['country_code']));
                return $location_value !== $condition_value && $location_country_code !== $condition_value;
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
