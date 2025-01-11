<?php
if (!defined('ABSPATH')) {
    exit;
}
add_action('wp_enqueue_scripts', 'enqueue_geo_target_scripts');
function enqueue_geo_target_scripts()
{
    wp_enqueue_script('geo-target-frontend');

    // Enqueue the geo popup style
    mgeo_enqueue('maki-geo-popup-style', 'build/blocks/geo-popup/style-geo-popup.css', 'style');
}
echo wp_kses_post($content);

