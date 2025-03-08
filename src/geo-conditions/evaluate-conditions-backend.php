<?php
if (!defined("ABSPATH")) {
    exit();
}

function mgeo_evaluate_geo_content($rule, $location_data)
{
    $final_result = mgeo_evaluate_geo_conditions(
        $rule["conditions"],
        $rule["operator"],
        $location_data
    );

    // Return whether content should be shown
    return $final_result
        ? $rule["action"] === "show"
        : $rule["action"] === "hide";
}

function mgeo_evaluate_geo_conditions($conditions, $operator, $location_data)
{
    if (empty($conditions)) {
        return true;
    }

    // Evaluate conditions
    $results = array_map(function ($condition) use ($location_data) {
        $location_value = trim(strtolower($location_data[$condition["type"]]));
        $condition_value = trim(strtolower($condition["value"]));

        if ($condition["operator"] === "is") {
            // When checking for country, also check for country_code. Ie, you can write country='US' and it should still work
            if ($condition["type"] === "country") {
                $location_country_code = trim(
                    strtolower($location_data["country_code"])
                );
                return $location_value === $condition_value ||
                    $location_country_code === $condition_value;
            }
            return $location_value === $condition_value;
        }
        // Again, when checking for country, also check for country_code. Ie, you can write country='US' and it should still work
        if ($condition["type"] === "country") {
            $location_country_code = trim(
                strtolower($location_data["country_code"])
            );
            return $location_value !== $condition_value &&
                $location_country_code !== $condition_value;
        }
        return $location_value !== $condition_value;
    }, $conditions);

    // Combine results based on operator
    return $operator === "AND"
        ? !in_array(false, $results, true)
        : in_array(true, $results, true);
}
