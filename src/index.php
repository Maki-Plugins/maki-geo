<?php

/**
 * Plugin Name:       Maki Geo
 * Description:       Geo targeting
 * Version:           0.0.1
 * Requires at least: 6.6
 * Requires PHP:      7.2
 *
 * @package maki-geo
 */

if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

add_action('init', 'register_geo_target_assets');

function register_geo_target_assets()
{
    // Registering for use when geo targeted content is embedded on the frontend
    wp_register_script(
        'geo-target-frontend',
        plugins_url('../build/geo-content-frontend.js', __FILE__),
        ['wp-api-fetch'],
        '1.0.0',
        true
    );

    wp_localize_script(
        'geo-target-frontend', 'makiGeoData', [
        'endpoint' => rest_url('maki-geo/v1/location'),
        'nonce' => wp_create_nonce('wp_rest')
        ]
    );
}





require_once "admin/admin.php";
require_once "blocks/setup.php";
require_once "api/location.php";
require_once "api/geo-rules.php";
require_once "shortcodes/geo-shortcodes.php";
require_once "geo-rules/evaluate-rule-backend.php";
require_once "wp_utils.php";
