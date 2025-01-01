<?php

/**
 * Plugin Name:       GeoUtils
 * Description:       Geo targeting
 * Version:           0.0.1
 * Requires at least: 6.6
 * Requires PHP:      7.2
 *
 * @package           geo-utils
 */

if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

function gu_create_geo_content_block()
{
    register_block_type(__DIR__ . '/build/blocks/geo-content');

    add_action('enqueue_block_assets', function () {
        // Inline script data
        $script = sprintf(
            'window.geoUtilsData = %s;',
            wp_json_encode([
                'nonce' => wp_create_nonce('wp_rest'),
                'endpoint' => rest_url('geoutils/v1/location')
            ])
        );

        // Add the inline script before your block's main script
        wp_add_inline_script('geo-utils-geo-content-block-editor-script', $script, 'before');
    });
}
add_action('init', 'gu_create_geo_content_block');

function gu_create_geo_popup_block()
{
    register_block_type(__DIR__ . '/build/blocks/geo-popup');

    add_action('enqueue_block_assets', function () {
        // Inline script data
        $script = sprintf(
            'window.geoUtilsData = %s;',
            wp_json_encode([
                'nonce' => wp_create_nonce('wp_rest'),
                'endpoint' => rest_url('geoutils/v1/location')
            ])
        );

        // Add the inline script before your block's main script
        wp_add_inline_script('geo-utils-geo-popup-block-editor-script', $script, 'before');
    });
}
add_action('init', 'gu_create_geo_popup_block');

require_once("src/index.php");
require_once("src/admin/admin.php");
