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


// WIP: Cannot get the block to show up in Gutenberg

// function create_location_block()
// {
//     register_block_type(__DIR__ . '../build/blocks/location');
// }
// add_action('init', 'create_location_block');


// add_action('wp_enqueue_scripts', function () {
//     wp_enqueue_script('geoutils-location-block', plugin_dir_url(__FILE__) . 'blocks/location.js', array('jquery'), '1.0', true);
//     wp_localize_script('geoutils-location-block', 'geoUtilsData', array(
//         'nonce' => wp_create_nonce('wp_rest'),
//         'apiUrl' => rest_url('geoutils/v1/location')
//     ));
// });


// add_action('enqueue_block_editor_assets', function () {
//     // Enqueue block script
//     wp_enqueue_script(
//         'geoutils-block-editor', // Script handle
//         plugin_dir_url(__FILE__) . '/blocks/location.js', // Path to your block.js file
//         array('wp-blocks', 'wp-element', 'wp-editor'), // WordPress dependencies
//         '1.0', // Version
//         true // Load in footer
//     );

//     // Enqueue editor styles for the block (optional)
//     wp_enqueue_style(
//         'geoutils-block-editor-style',
//         plugin_dir_url(__FILE__) . 'blocks/location.css', // Path to your block's CSS file
//         array(),
//         '1.0'
//     );
// });

require_once("blocks/setup.php");
require_once("api/location.php");
require_once("api/location.php");
