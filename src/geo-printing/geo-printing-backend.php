<?php
/**
 * Backend logic for geo printing shortcodes.
 * Handles server-side rendering and placeholder generation for client-side.
 *
 * @package Maki_Geo
 */

if (!defined("ABSPATH")) {
    exit();
}

/**
 * Helper function to get location data, caching it per request.
 *
 * @return array|null Location data or null if not available.
 */
function mgeo_get_location_data()
{
    static $location_data = null;

    if ($location_data === null) {
        $location_data = mgeo_get_geolocation_data();
    }

    return $location_data;
}

/**
 * Generic handler for simple geo printing shortcodes (continent, country, region, city).
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
        // Server-side: Process immediately
        $location_data = mgeo_get_location_data();
        if (
            !$location_data ||
            !isset($location_data[$field]) ||
            $location_data[$field] == "Unknown"
        ) {
            return $default_value;
        }
        return esc_html($location_data[$field]);
    }
}

/**
 * Handler for the country flag shortcode.
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

    // Ensure size has a unit for server-side rendering
    if (is_numeric($size)) {
        $size .= "px";
    }

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
        // Server-side: Process immediately
        $location_data = mgeo_get_location_data();
        if (
            !$location_data ||
            empty($location_data["country_code"]) ||
            $location_data["country_code"] == "Unknown"
        ) {
            return ""; // Return empty string if no country code
        }

        $country_code = strtolower($location_data["country_code"]);
        $flag_path =
            plugin_dir_url(dirname(__DIR__)) .
            "src/assets/flags/" .
            $country_code .
            ".svg";

        return sprintf(
            '<img src="%s" alt="%s flag" class="mgeo-country-flag" style="width: %s; height: auto;" />',
            esc_url($flag_path),
            esc_attr($location_data["country"]),
            esc_attr($size) // Use sanitized size with unit
        );
    }
}

// Register shortcodes
add_shortcode("mgeo_continent", "mgeo_shortcode_handler");
add_shortcode("mgeo_country", "mgeo_shortcode_handler");
add_shortcode("mgeo_region", "mgeo_shortcode_handler");
add_shortcode("mgeo_city", "mgeo_shortcode_handler");
add_shortcode("mgeo_country_flag", "mgeo_country_flag_shortcode");

?>
