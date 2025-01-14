<?php

if (!defined('ABSPATH')) {
    exit;
}

function mgeo_get_location_data()
{
    static $location_data = null;
    
    if ($location_data === null) {
        $location_data = mgeo_get_geolocation_data();
    }
    
    return $location_data;
}

function mgeo_shortcode_handler($atts, $content, $tag)
{
    $defaults = array(
        'default' => 'Unknown'
    );
    
    $atts = shortcode_atts($defaults, $atts);
    $location_data = mgeo_get_location_data();
    
    $field = str_replace('mgeo_', '', $tag);
    if (!$location_data || !isset($location_data[$field]) || $location_data[$field] == "Unknown") {
        return $atts['default'];
    }

    return $location_data[$field];
}

function mgeo_country_flag_shortcode($atts)
{
    $defaults = array(
        'size' => '24px'
    );
    
    $atts = shortcode_atts($defaults, $atts);
    $location_data = mgeo_get_location_data();
    
    if (!$location_data || empty($location_data['country_code']) || $location_data['country_code'] == "Unknown") {
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
