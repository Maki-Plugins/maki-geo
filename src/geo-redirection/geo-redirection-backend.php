<?php
/**
 * Geo redirection functionality
 *
 * @package Maki_Geo
 */

if (!defined("ABSPATH")) {
    exit();
}

/**
 * Initialize geo redirection functionality
 */
function mgeo_init_geo_redirection()
{
    // Only run on frontend, not in admin or AJAX requests
    if (is_admin() || wp_doing_ajax()) {
        return;
    }

    // Get client/server mode setting
    $client_server_mode = get_option("mgeo_client_server_mode", "server");

    // Only process server-side redirections in server mode
    if ($client_server_mode !== "server") {
        return;
    }

    // Get current URL
    $current_url = mgeo_get_current_url();

    // Get all redirections
    $redirections = mgeo_get_redirections();
    if (empty($redirections)) {
        return;
    }

    // Get geo location data
    $location_data = mgeo_get_geolocation_data();
    if (empty($location_data)) {
        return;
    }

    // Find matching redirection
    $redirect_url = mgeo_find_matching_redirection(
        $redirections,
        $location_data,
        $current_url
    );

    // Perform redirection if a match was found
    if (!empty($redirect_url)) {
        wp_redirect($redirect_url, 302);
        exit();
    }
}

/**
 * Get all configured redirections
 *
 * @return array Array of redirection configurations
 */
function mgeo_get_redirections()
{
    $redirections = get_option("mgeo_redirections", []);

    // If stored as JSON string, decode it
    if (is_string($redirections) && !empty($redirections)) {
        $decoded = json_decode($redirections, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $redirections = $decoded;
        }
    }

    return is_array($redirections) ? $redirections : [];
}

/**
 * Get the current full URL
 *
 * @return string The current URL
 */
function mgeo_get_current_url()
{
    $protocol =
        isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] === "on"
            ? "https"
            : "http";
    $host = $_SERVER["HTTP_HOST"];
    $uri = $_SERVER["REQUEST_URI"];

    return $protocol . "://" . $host . $uri;
}

/**
 * Find a matching redirection for the given location and URL
 *
 * @param array $redirections Array of redirection configurations
 * @param array $location_data User's location data
 * @param string $current_url Current URL
 * @return string|null Redirect URL if a match is found, null otherwise
 */
function mgeo_find_matching_redirection(
    $redirections,
    $location_data,
    $current_url
) {
    // Parse the current URL
    $url_parts = parse_url($current_url);
    $path = isset($url_parts["path"]) ? $url_parts["path"] : "/";
    $query = isset($url_parts["query"]) ? $url_parts["query"] : "";
    $hash = isset($url_parts["fragment"]) ? $url_parts["fragment"] : "";

    // Loop through all redirections
    foreach ($redirections as $redirection) {
        // Skip disabled redirections
        if (!isset($redirection["isEnabled"]) || !$redirection["isEnabled"]) {
            continue;
        }

        // Check each location within this redirection
        foreach ($redirection["locations"] as $location) {
            // Check if location conditions match
            if (!mgeo_location_conditions_match($location, $location_data)) {
                continue;
            }

            // Check if URL is excluded
            if (mgeo_is_url_excluded($location, $path, $query, $hash)) {
                continue;
            }

            // Handle different page targeting types
            if ($location["pageTargetingType"] === "all") {
                // All pages redirection
                return mgeo_build_redirect_url(
                    $location["redirectUrl"],
                    $path,
                    $query,
                    $hash,
                    $location
                );
            } elseif ($location["pageTargetingType"] === "specific") {
                // Specific page mappings
                foreach ($location["redirectMappings"] as $mapping) {
                    if (mgeo_url_matches_mapping($path, $mapping["fromUrl"])) {
                        return mgeo_build_redirect_url(
                            $mapping["toUrl"],
                            $path,
                            $query,
                            $hash,
                            $location
                        );
                    }
                }
            }
        }
    }

    return null;
}

/**
 * Check if location conditions match the user's location
 *
 * @param array $location Location configuration
 * @param array $location_data User's location data
 * @return bool Whether the conditions match
 */
function mgeo_location_conditions_match($location, $location_data)
{
    return mgeo_evaluate_geo_conditions(
        $location["conditions"],
        $location["operator"],
        $location_data
    );
}

/**
 * Check if the current URL is excluded by any exclusion rules
 *
 * @param array $location Location configuration
 * @param string $path URL path
 * @param string $query URL query string
 * @param string $hash URL hash fragment
 * @return bool Whether the URL is excluded
 */
function mgeo_is_url_excluded($location, $path, $query, $hash)
{
    if (empty($location["exclusions"])) {
        return false;
    }

    foreach ($location["exclusions"] as $exclusion) {
        $value = $exclusion["value"];

        switch ($exclusion["type"]) {
            case "url_equals":
                if ($path === $value) {
                    return true;
                }
                break;

            case "url_contains":
                if (strpos($path, $value) !== false) {
                    return true;
                }
                break;

            case "query_contains":
                if (strpos($query, $value) !== false) {
                    return true;
                }
                break;

            case "hash_contains":
                if (strpos($hash, $value) !== false) {
                    return true;
                }
                break;
        }
    }

    return false;
}

/**
 * Check if a URL path matches a mapping pattern
 *
 * @param string $path Current URL path
 * @param string $pattern Mapping pattern to match against
 * @return bool Whether the path matches the pattern
 */
function mgeo_url_matches_mapping($path, $pattern)
{
    // Simple exact matching for now
    // Could be extended with wildcard or regex support in the future
    return $path === $pattern;
}

/**
 * Build the final redirect URL based on configuration
 *
 * @param string $base_url Base redirect URL
 * @param string $path Current URL path
 * @param string $query Current URL query string
 * @param string $hash Current URL hash fragment
 * @param array $location Location configuration
 * @return string Final redirect URL
 */
function mgeo_build_redirect_url($base_url, $path, $query, $hash, $location)
{
    $redirect_url = rtrim($base_url, "/");

    // Add path if configured
    if (!empty($location["passPath"])) {
        // For specific page mappings, don't add the path as it's already handled in the mapping
        if ($location["pageTargetingType"] === "all") {
            $redirect_url .= $path;
        }
    }

    // Add query string if configured
    if (!empty($location["passQuery"]) && !empty($query)) {
        $redirect_url .= "?" . $query;
    }

    // Always pass hash fragment if present
    if (!empty($hash)) {
        $redirect_url .= "#" . $hash;
    }

    return $redirect_url;
}

/**
 * Save redirections to the database
 *
 * @param array $redirections Array of redirection configurations
 * @return bool Whether the save was successful
 */
function mgeo_save_redirections($redirections)
{
    // Ensure we have an array
    if (!is_array($redirections)) {
        return false;
    }

    // Update the option
    return update_option("mgeo_redirections", $redirections);
}

/**
 * Sanitize redirections data before saving
 *
 * @param mixed $redirections Redirections data to sanitize
 * @return array Sanitized redirections data
 */
function mgeo_sanitize_redirections($redirections)
{
    // If it's a JSON string, decode it
    if (is_string($redirections)) {
        $decoded = json_decode($redirections, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $redirections = $decoded;
        }
    }

    // Ensure we have an array
    if (!is_array($redirections)) {
        return [];
    }

    // Return the sanitized array
    return $redirections;
}

// Hook into WordPress to initialize geo redirection
add_action("template_redirect", "mgeo_init_geo_redirection", 1);

/**
 * Add client-side redirection script if needed
 */
function mgeo_add_client_side_redirection()
{
    // Only run on frontend, not in admin
    if (is_admin()) {
        return;
    }

    // Get client/server mode setting
    $client_server_mode = get_option("mgeo_client_server_mode", "server");

    // Only add script in client mode
    if ($client_server_mode !== "client") {
        return;
    }

    // Check if there are any redirections configured
    $redirections = mgeo_get_redirections();
    if (empty($redirections)) {
        return;
    }

    // Enqueue the client-side redirection script
    wp_enqueue_script(
        "mgeo-client-redirection",
        plugins_url("assets/js/client-redirection.js", dirname(__FILE__)),
        ["wp-api-fetch"],
        "1.0.0",
        true
    );
}
add_action("wp_enqueue_scripts", "mgeo_add_client_side_redirection");
