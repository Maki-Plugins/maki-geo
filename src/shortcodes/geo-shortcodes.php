<?php

if (!defined('ABSPATH')) {
    exit;
}

function mgeo_get_location_data()
{
    static $location_data = null;
    
    if ($location_data === null) {
        $location_data = get_geolocation_data();
    }
    
    return $location_data;
}

function mgeo_shortcode_handler($atts, $content, $tag)
{
    $defaults = array(
        'default' => 'Unknown',
        'lang' => 'en'
    );
    
    $atts = shortcode_atts($defaults, $atts);
    $location_data = mgeo_get_location_data();
    
    if (!$location_data) {
        return $atts['default'];
    }

    $field = str_replace('mgeo_', '', $tag);
    $value = isset($location_data[$field]) ? $location_data[$field] : $atts['default'];
    
    // Handle localization if needed
    if ($atts['lang'] !== 'en') {
        $value = mgeo_translate_location($value, $field, $atts['lang']);
    }
    
    return $value;
}

function mgeo_translate_location($value, $field, $lang)
{
    // Add translations for common countries
    $translations = [
        'nl' => [
            'Netherlands' => 'Nederland',
            'Germany' => 'Duitsland',
            'France' => 'Frankrijk',
            'Belgium' => 'België',
            // Add more as needed
        ],
        // Add more languages as needed
    ];

    if (isset($translations[$lang]) && isset($translations[$lang][$value])) {
        return $translations[$lang][$value];
    }

    return $value;
}

function mgeo_country_flag_shortcode($atts)
{
    $defaults = array(
        'size' => '24px'
    );
    
    $atts = shortcode_atts($defaults, $atts);
    $location_data = mgeo_get_location_data();
    
    if (!$location_data || empty($location_data['country_code'])) {
        return '';
    }

    $country_code = strtolower($location_data['country_code']);
    $flag_path = plugin_dir_url(dirname(__DIR__)) . 'src/assets/flags/' . $country_code . '.svg';
    
    // Ensure size has a unit
    if (is_numeric($atts['size'])) {
        $atts['size'] .= 'px';
    }
    
    return sprintf(
        '<img src="%s" alt="%s flag" class="mgeo-country-flag" style="width: %s; height: auto;" />', 
        esc_url($flag_path), 
        esc_attr($location_data['country']),
        esc_attr($atts['size'])
    );
}


function mgeo_content_shortcode($atts, $content = '')
{
    // Check targeting method
    $options = get_option('maki_geo_options', array());
    $method = isset($options['geo_targeting_method']) ? $options['geo_targeting_method'] : 'server';

    if ($method === 'client') {
        // Enqueue the frontend script
        wp_enqueue_script('geo-target-frontend');

        $attributes = shortcode_atts(
            array(
                'rule' => '',        // For global rules
                'continent' => '',
                'country' => '',
                'region' => '',
                'city' => '',
                'ip' => '',
                'match' => 'all',    // 'all' or 'any'
                'action' => 'show'   // 'show' or 'hide'
            ), 
            $atts
        );

        // Get the rule structure
        $rule = mgeo_get_rule_from_attributes($attributes);
        if (!$rule) {
            return '';
        }

        // Determine if this is a local or global rule
        $ruleType = empty($attributes['rule']) ? 'local' : 'global';
        $ruleData = $ruleType === 'global' ? $attributes['rule'] : json_encode($rule);

        return sprintf(
            '<div class="gu-geo-target-block" style="display: none" data-ruletype="%s" data-rule="%s">%s</div>',
            esc_attr($ruleType),
            esc_attr($ruleData),
            do_shortcode($content)
        );
    }

    // Server-side processing
    $location_data = mgeo_get_location_data();
    if (!$location_data) {
        return '';
    }

    $attributes = shortcode_atts(
        array(
        'rule' => '',        // For global rules
        'continent' => '',
        'country' => '',
        'region' => '',
        'city' => '',
        'ip' => '',
        'match' => 'all',    // 'all' or 'any'
        'action' => 'show'   // 'show' or 'hide'
        ), $atts
    );

    // Get the rule to evaluate
    $rule = mgeo_get_rule_from_attributes($attributes);
    if (!$rule) {
        return '';
    }

    // Evaluate the rule and return content accordingly
    return mgeo_evaluate_rule($rule, $location_data) ? do_shortcode($content) : '';
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


// Register shortcodes
add_shortcode('mgeo_continent', 'mgeo_shortcode_handler');
add_shortcode('mgeo_country', 'mgeo_shortcode_handler');
add_shortcode('mgeo_region', 'mgeo_shortcode_handler');
add_shortcode('mgeo_city', 'mgeo_shortcode_handler');
add_shortcode('mgeo_country_flag', 'mgeo_country_flag_shortcode');
add_shortcode('mgeo_content', 'mgeo_content_shortcode');
