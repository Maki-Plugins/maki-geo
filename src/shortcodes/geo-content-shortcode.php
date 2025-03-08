<?php

if (!defined("ABSPATH")) {
    exit();
}

function mgeo_content_shortcode($atts, $content = "")
{
    // Check targeting method
    $method = get_option("mgeo_client_server_mode", "server");

    $attributes = shortcode_atts(
        [
            "continent" => "",
            "country" => "",
            "region" => "",
            "city" => "",
            "ip" => "",
            "match" => "all", // 'all' or 'any'
            "action" => "show", // 'show' or 'hide'
        ],
        $atts
    );

    // Get the rule structure
    $rule = mgeo_get_rule_from_attributes($attributes);
    if (!$rule) {
        return "";
    }

    if ($method === "client") {
        // Enqueue the frontend script
        wp_enqueue_script("geo-target-frontend");

        $ruleData = wp_json_encode($rule);

        return sprintf(
            '<div class="mgeo-geo-target-block" style="display: none" data-rule="%s">%s</div>',
            esc_attr($ruleData),
            do_shortcode($content)
        );
    }

    // Server-side processing
    $location_data = mgeo_get_location_data();
    if (!$location_data) {
        return "";
    }

    // Evaluate the rule and return content accordingly
    if (mgeo_evaluate_geo_content($rule, $location_data)) {
        return sprintf("<div>%s</div>", do_shortcode($content));
    }

    return "";
}

function mgeo_get_rule_from_attributes($attributes)
{
    // Build rule from attributes
    $conditions = [];
    $location_fields = ["continent", "country", "region", "city", "ip"];

    foreach ($location_fields as $field) {
        if (!empty($attributes[$field])) {
            $values = array_map("trim", explode(",", $attributes[$field]));
            foreach ($values as $value) {
                $operator = "is";
                if (strpos($value, "!") === 0) {
                    $operator = "is not";
                    $value = substr($value, 1);
                }
                $conditions[] = [
                    "type" => $field,
                    "value" => $value,
                    "operator" => $operator,
                ];
            }
        }
    }

    return [
        "conditions" => $conditions,
        "operator" => strtoupper($attributes["match"]) === "ANY" ? "OR" : "AND",
        "action" => $attributes["action"],
    ];
}

add_shortcode("mgeo_content", "mgeo_content_shortcode");
