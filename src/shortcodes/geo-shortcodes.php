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

// Register shortcodes
add_shortcode('mgeo_continent', 'mgeo_shortcode_handler');
add_shortcode('mgeo_country', 'mgeo_shortcode_handler');
add_shortcode('mgeo_region', 'mgeo_shortcode_handler');
add_shortcode('mgeo_city', 'mgeo_shortcode_handler');
add_shortcode('mgeo_country_flag', 'mgeo_country_flag_shortcode');
add_shortcode('geo_content', 'mgeo_content_shortcode');

function mgeo_content_shortcode($atts, $content = '') {
    $attributes = shortcode_atts(array(
        'rule' => '',        // For global rules
        'continent' => '',
        'country' => '',
        'region' => '',
        'city' => '',
        'ip' => '',
        'match' => 'all',    // 'all' or 'any'
        'action' => 'show'   // 'show' or 'hide'
    ), $atts);

    // Handle global rules
    if (!empty($attributes['rule'])) {
        $global_rules = get_option('maki_geo_global_rules', array());
        $rule = array_filter($global_rules, function($r) use ($attributes) {
            return $r['id'] === $attributes['rule'];
        });
        
        if (empty($rule)) {
            return '';
        }
        
        $rule = reset($rule);
        return mgeo_evaluate_rule($rule, $content);
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

    $rule = array(
        'conditions' => $conditions,
        'operator' => strtoupper($attributes['match']) === 'ANY' ? 'OR' : 'AND',
        'action' => $attributes['action']
    );

    return mgeo_evaluate_rule($rule, $content);
}

function mgeo_evaluate_rule($rule, $content) {
    $location_data = mgeo_get_location_data();
    
    if (!$location_data) {
        return '';
    }

    // Evaluate conditions
    $results = array_map(function($condition) use ($location_data) {
        $location_value = strtolower($location_data[$condition['type']]);
        $condition_value = strtolower($condition['value']);
        
        if ($condition['operator'] === 'is') {
            return $location_value === $condition_value;
        }
        return $location_value !== $condition_value;
    }, $rule['conditions']);

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
