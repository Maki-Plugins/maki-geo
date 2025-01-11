<?php
if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}


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
add_action('init', 'register_geo_target_assets');


// Register Gutenberg blocks
function mgeo_create_geo_content_block()
{
    register_block_type(__DIR__ . '/../build/blocks/geo-content');

    add_action(
        'enqueue_block_assets', function () {
            // Inline script data
            $script = sprintf(
                'window.makiGeoData = %s;',
                wp_json_encode(
                    [
                    'nonce' => wp_create_nonce('wp_rest'),
                    'globalRules' => get_option('maki_geo_rules', [])
                    ]
                )
            );

            // Add the inline script before the block's main script
            wp_add_inline_script('maki-geo-geo-content-editor-script', $script, 'before');
        }
    );
}
add_action('init', 'mgeo_create_geo_content_block');

function mgeo_create_geo_popup_block()
{
    register_block_type(__DIR__ . '/../build/blocks/geo-popup');

    add_action(
        'enqueue_block_assets', function () {
            // Inline script data
            $script = sprintf(
                'window.makiGeoData = %s;',
                wp_json_encode(
                    [
                    'nonce' => wp_create_nonce('wp_rest'),
                    'globalRules' => get_option('maki_geo_rules', [])
                    ]
                )
            );

            // Add the inline script before the block's main script
            wp_add_inline_script('maki-geo-geo-popup-editor-script', $script, 'before');
        }
    );
}
add_action('init', 'mgeo_create_geo_popup_block');




require_once "admin/admin.php";
require_once "blocks/setup.php";
require_once "api/location.php";
require_once "api/geo-rules.php";
require_once "shortcodes/geo-shortcodes.php";
require_once "geo-rules/evaluate-rule-backend.php";
require_once "wp-utils.php";
