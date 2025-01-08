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
    $location_data = mgeo_get_location_data();
    
    if (!$location_data || empty($location_data['country_code'])) {
        return '';
    }

    $country_code = strtolower($location_data['country_code']);
    $flag_path = plugin_dir_url(dirname(__DIR__)) . 'src/assets/flags/' . $country_code . '.svg';
    
    return sprintf(
        '<img src="%s" alt="%s flag" class="mgeo-country-flag" />', 
        esc_url($flag_path), 
        esc_attr($location_data['country'])
    );
}

// Register shortcodes
add_shortcode('mgeo_continent', 'mgeo_shortcode_handler');
add_shortcode('mgeo_country', 'mgeo_shortcode_handler');
add_shortcode('mgeo_region', 'mgeo_shortcode_handler');
add_shortcode('mgeo_city', 'mgeo_shortcode_handler');
add_shortcode('mgeo_country_flag', 'mgeo_country_flag_shortcode');

