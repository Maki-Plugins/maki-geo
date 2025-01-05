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

add_action('wp_enqueue_scripts', 'enqueue_geo_target_scripts');

function enqueue_geo_target_scripts()
{
    wp_enqueue_script('geo-target-frontend');

    // Enqueue the geo popup styles
    wp_enqueue_style(
        'geo-utils-popup-style',
        plugins_url('blocks/geo-popup/style.css', __FILE__),
        [],
        '1.0.0'
    );

    // Enqueue the popup handler script
    wp_enqueue_script(
        'geo-utils-popup-handler',
        plugins_url('blocks/geo-popup/popup-handler.js', __FILE__),
        [],
        '1.0.0',
        true // Load in footer
    );
}



require_once "blocks/setup.php";
require_once "api/location.php";
require_once "api/geo-rules.php";
require_once "shortcodes/geo-shortcodes.php";
