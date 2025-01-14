<?php
if (!defined('ABSPATH')) {
    exit;
}
add_action('wp_enqueue_scripts', 'mgeo_enqueue_geo_popup_style');
function mgeo_enqueue_geo_popup_style()
{
    mgeo_enqueue('maki-geo-popup-style', 'build/blocks/geo-popup/style-geo-popup.css', 'style');
}
echo wp_kses_post($content);

