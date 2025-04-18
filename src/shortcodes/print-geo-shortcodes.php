<?php
/**
 * This file previously contained geo printing shortcode handlers.
 * They have been moved to src/geo-printing/geo-printing-backend.php
 *
 * Handles the registration and mode-switching logic for geo printing shortcodes.
 *
 * @package Maki_Geo
 */

if (!defined("ABSPATH")) {
    exit();
}

/**
 * Generic handler for simple geo printing shortcodes (continent, country, region, city).
 * Determines whether to render server-side or output a client-side placeholder.
 *
 * @param array  $atts    Shortcode attributes.
 * @param string $content Shortcode content (unused).
 * @param string $tag     The shortcode tag being processed.
 * @return string HTML output (either location data or placeholder span).
 */
function mgeo_shortcode_handler($atts, $content, $tag)
{
    $defaults = [
        "default" => "Unknown",
    ];

    $atts = shortcode_atts($defaults, $atts, $tag);
    $field = str_replace("mgeo_", "", $tag);
    $default_value = esc_attr($atts["default"]);

    // Check targeting method
    $method = get_option("mgeo_client_server_mode", "server");

    if ($method === "client") {
        // Client-side: Output placeholder span
        // The actual script enqueueing is handled in src/geo-printing/geo-printing-frontend.php
        return sprintf(
            '<span data-mgeo-print="true" data-mgeo-field="%s" data-mgeo-default="%s" style="visibility: hidden;">%s</span>',
            esc_attr($field),
            $default_value,
            $default_value // Initial content, hidden until JS updates
        );
    } else {
        // Server-side: Call backend rendering function
        return mgeo_render_server_side_shortcode($field, $default_value);
    }
}

/**
 * Handler for the country flag shortcode.
 * Determines whether to render server-side or output a client-side placeholder.
 *
 * @param array $atts Shortcode attributes.
 * @return string HTML output (either img tag or placeholder span).
 */
function mgeo_country_flag_shortcode($atts)
{
    $defaults = [
        "size" => "24px",
    ];

    $atts = shortcode_atts($defaults, $atts);
    $size = esc_attr($atts["size"]);

    // Check targeting method
    $method = get_option("mgeo_client_server_mode", "server");

    if ($method === "client") {
        // Client-side: Output placeholder span
        // The actual script enqueueing is handled in src/geo-printing/geo-printing-frontend.php
        return sprintf(
            '<span data-mgeo-print="true" data-mgeo-field="flag" data-mgeo-size="%s" style="visibility: hidden;"></span>',
            esc_attr($atts["size"]) // Pass original size value
        );
    } else {
        // Server-side: Call backend rendering function
        return mgeo_render_server_side_flag_shortcode($size);
    }
}

// Register shortcodes
add_shortcode("mgeo_continent", "mgeo_shortcode_handler");
add_shortcode("mgeo_country", "mgeo_shortcode_handler");
add_shortcode("mgeo_region", "mgeo_shortcode_handler");
add_shortcode("mgeo_city", "mgeo_shortcode_handler");
add_shortcode("mgeo_country_flag", "mgeo_country_flag_shortcode");
