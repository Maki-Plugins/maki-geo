<?php
function mgeo_content_shortcode($atts, $content = '')
{
    // Check targeting method
    $options = get_option('maki_geo_options', array());
    $method = isset($options['client_server_mode']) ? $options['client_server_mode'] : 'server';

    $attributes = shortcode_atts(
        array(
            'rule' => '',        // For global rules
            'continent' => '',
            'country' => '',
            'region' => '',
            'city' => '',
            'ip' => '',
            'match' => 'all',    // 'all' or 'any'
            'action' => 'show',  // 'show' or 'hide'
            'display' => 'block' // 'block' or 'flex'
        ), 
        $atts
    );

    // Get the rule structure
    $rule = mgeo_get_rule_from_attributes($attributes);
    if (!$rule) {
        return '';
    }

    if ($method === 'client') {
        // Enqueue the frontend script
        wp_enqueue_script('geo-target-frontend');

        // Determine if this is a local or global rule
        $ruleType = empty($attributes['rule']) ? 'local' : 'global';
        $ruleData = $ruleType === 'global' ? $attributes['rule'] : wp_json_encode($rule);

        // If this is a popup, enqueue its assets
        if ($attributes['display'] === 'flex') {
            wp_enqueue_style('maki-geo-popup-style');
            wp_enqueue_script('maki-geo-popup-handler');
        }

        return sprintf(
            '<div class="mgeo-geo-target-block" style="display: none" data-ruletype="%s" data-rule="%s" data-display="%s">%s</div>',
            esc_attr($ruleType),
            esc_attr($ruleData),
            esc_attr($attributes['display']),
            do_shortcode($content)
        );
    }

    // Server-side processing
    $location_data = mgeo_get_location_data();
    if (!$location_data) {
        return '';
    }

    // Evaluate the rule and return content accordingly
    if (mgeo_evaluate_rule($rule, $location_data)) {
        return sprintf(
            '<div>%s</div>',
            do_shortcode($content)
        );
    }
    
    return '';
}

function mgeo_get_rule_from_attributes($attributes)
{
    // Handle global rules
    if (!empty($attributes['rule'])) {
        $global_rules = get_option('maki_geo_global_rules', array());
        $rule = array_filter(
            $global_rules, function ($r) use ($attributes) {
                return $r['id'] === $attributes['rule'];
            }
        );
        
        return empty($rule) ? null : reset($rule);
    }

    // Build local rule from attributes
    $conditions = array();
    $location_fields = ['continent', 'country', 'region', 'city', 'ip'];
    
    foreach ($location_fields as $field) {
        if (!empty($attributes[$field])) {
            $values = array_map('trim', explode(',', $attributes[$field]));
            foreach ($values as $value) {
                $operator = 'is';
                if (strpos($value, '!') === 0) {
                    $operator = 'is not';
                    $value = substr($value, 1);
                }
                $conditions[] = array(
                    'type' => $field,
                    'value' => $value,
                    'operator' => $operator
                );
            }
        }
    }

    return array(
        'conditions' => $conditions,
        'operator' => strtoupper($attributes['match']) === 'ANY' ? 'OR' : 'AND',
        'action' => $attributes['action']
    );
}

add_shortcode('mgeo_content', 'mgeo_content_shortcode');
