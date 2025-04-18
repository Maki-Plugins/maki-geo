<?php
/**
 * Backend logic for server-side geo printing.
 * Contains functions to fetch location data and render shortcode output.
 *
 * @package Maki_Geo
 */

if (!defined("ABSPATH")) {
    exit();
}

/**
 * Helper function to get location data, caching it per request.
 * @param bool $force_refresh Optional. Whether to force refreshing the static cache. Default false.
 * @return array|null Location data or null if not available.
 */
function mgeo_get_location_data($force_refresh = false)
{
    static $location_data = null;

    if ($location_data === null || $force_refresh) {
        $location_data = mgeo_get_geolocation_data();
    }

    return $location_data;
}

/**
 * Renders the server-side output for simple geo printing shortcodes.
 *
 * @param string $field         The location field to display (e.g., 'country', 'city').
 * @param string $default_value The default value to show if data is unavailable.
 * @return string HTML output (location data or default value).
 */
function mgeo_render_server_side_shortcode($field, $default_value)
{
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

/**
 * Renders the server-side output for the country flag shortcode.
 *
 * @param string $size The desired size attribute for the flag (e.g., '24px', '2em').
 * @return string HTML output (img tag or empty string).
 */
function mgeo_render_server_side_flag_shortcode($size)
{
    // Ensure size has a unit for server-side rendering
    $sanitized_size = $size;
    if (is_numeric($sanitized_size)) {
        $sanitized_size .= "px";
    }

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
        esc_attr($sanitized_size) // Use sanitized size with unit
    );
}
