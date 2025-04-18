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

    // Get all redirections
    $redirections = mgeo_get_redirections();
    if (empty($redirections)) {
        return;
    }

    // Get current URL
    $current_url = mgeo_get_current_url();
    // Check if the current URL has any potential redirections before making an API call
    if (!mgeo_url_has_potential_redirections($redirections, $current_url)) {
        return;
    }

    // Get geo location data - only called if there are potential redirections for this URL
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
 * Check if the current URL has any potential redirections
 *
 * @param array $redirections Array of redirection configurations
 * @param string $current_url Current URL
 * @return bool Whether the URL has any potential redirections
 */
function mgeo_url_has_potential_redirections($redirections, $current_url)
{
    // Parse the current URL
    $url_parts = parse_url($current_url);
    $scheme = isset($url_parts["scheme"]) ? $url_parts["scheme"] : "https";
    $host = isset($url_parts["host"]) ? $url_parts["host"] : "";
    $path = isset($url_parts["path"]) ? $url_parts["path"] : "/";
    $query = isset($url_parts["query"]) ? $url_parts["query"] : "";
    $hash = isset($url_parts["fragment"]) ? $url_parts["fragment"] : "";
    $url_without_query = $scheme . "://" . $host . $path;

    // Loop through all redirections
    foreach ($redirections as $redirection) {
        // Skip disabled redirections
        if (!isset($redirection["isEnabled"]) || !$redirection["isEnabled"]) {
            continue;
        }

        // Check each location within this redirection
        foreach ($redirection["locations"] as $location) {
            // Check if URL is excluded
            if (mgeo_is_url_excluded($location, $path, $query, $hash)) {
                continue;
            }

            // Handle different page targeting types
            if ($location["pageTargetingType"] === "all") {
                // All pages redirection - this URL is potentially redirectable
                return true;
            } elseif ($location["pageTargetingType"] === "specific") {
                // Specific page mappings - check if this URL matches any mapping
                foreach ($location["redirectMappings"] as $mapping) {
                    if (
                        mgeo_url_matches_mapping(
                            $url_without_query,
                            $mapping["fromUrl"]
                        )
                    ) {
                        return true;
                    }
                }
            }
        }
    }

    return false;
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
    $scheme = isset($url_parts["scheme"]) ? $url_parts["scheme"] : "https";
    $host = isset($url_parts["host"]) ? $url_parts["host"] : "";
    $path = isset($url_parts["path"]) ? $url_parts["path"] : "/";
    $query = isset($url_parts["query"]) ? $url_parts["query"] : "";
    $hash = isset($url_parts["fragment"]) ? $url_parts["fragment"] : "";
    $url_without_query = $scheme . "://" . $host . $path;

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
                    if (
                        mgeo_url_matches_mapping(
                            $url_without_query,
                            $mapping["fromUrl"]
                        )
                    ) {
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
 * Check if a URL matches a mapping pattern
 *
 * @param string $url Current URL
 * @param string $pattern Mapping pattern to match against
 * @return bool Whether the URL matches the pattern
 */
function mgeo_url_matches_mapping($url, $pattern)
{
    // If pattern is a full URL (contains http:// or https://)
    if (
        strpos($pattern, "http://") === 0 ||
        strpos($pattern, "https://") === 0
    ) {
        return $url === $pattern;
    }

    // Otherwise, treat pattern as a path and compare with the path of the URL
    $url_parts = parse_url($url);
    $path = isset($url_parts["path"]) ? $url_parts["path"] : "/";

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
    $redirect_url = $base_url; // Start with the original base URL

    // Handle path appending for 'all' page targeting
    if (!empty($location["passPath"]) && $location["pageTargetingType"] === "all") {
        // Ensure base URL doesn't have a slash if path starts with one, or vice versa
        if (str_ends_with($redirect_url, '/') && str_starts_with($path, '/')) {
            $redirect_url = rtrim($redirect_url, '/'); // Remove from base
        } elseif (!str_ends_with($redirect_url, '/') && !str_starts_with($path, '/')) {
             // Add slash if neither has one, unless path is just '/'
             if ($path !== '/') {
                 $redirect_url .= '/';
             }
        }
        // Append the path, ensuring not to add '//' if path is just '/'
        $redirect_url .= ($path === '/' && str_ends_with($base_url, '/')) ? '' : $path;

    } else {
         // For specific mapping or when passPath is false, just use the base_url (which might be the toUrl from mapping)
         // No path appending needed here. We trust the base_url (or mapping's toUrl) is correct.
    }


    // Add query string if configured
    if (!empty($location["passQuery"]) && !empty($query)) {
        // Check if URL already has a query string
        $separator = strpos($redirect_url, '?') === false ? '?' : '&';
        $redirect_url .= $separator . $query;
    }

    // Always pass hash fragment if present
    if (!empty($hash)) {
        // Check if URL already has a hash
        if (strpos($redirect_url, '#') === false) {
             $redirect_url .= "#" . $hash;
        }
    }

    return $redirect_url;
}

// Hook into WordPress to initialize geo redirection
add_action("template_redirect", "mgeo_init_geo_redirection", 1);
