<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action('wp_enqueue_scripts', 'enqueue_geo_target_scripts');
function enqueue_geo_target_scripts()
{
    wp_enqueue_script('geo-target-frontend');

    // Enqueue the geo popup styles and script
    mgeo_enqueue('maki-geo-popup-style', 'build/blocks/geo-popup/geo-popup.css');
    mgeo_enqueue('maki-geo-popup-handler', 'build/blocks/geo-popup/popup-handler.js');
}


echo wp_kses_post($content);

