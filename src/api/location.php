<?php
if (!defined("ABSPATH")) {
    exit();
}

add_action("rest_api_init", function () {
    register_rest_route("maki-geo/v1", "/location", [
        "methods" => "GET",
        "callback" => "mgeo_get_geolocation_data",
        "permission_callback" => "__return_true",
    ]);
});

/**
 * Gets the location of the requestor based on IP geolocation.
 *
 * Returns a type like:
 * type LocationData = {
 *  continent: string;
 *  country_code: string;
 *  country: string;
 *  region: string;
 *  city: string;
 *  latitude: string;
 *  longitude: string;
 *  attribution?: string;
 * };
 */
function mgeo_get_geolocation_data()
{
    // --- E2E Testing Debug Mechanism ---
    // Allow forcing a location via query parameter ONLY if MGEO_E2E_TESTING is defined and true
    if (defined('MGEO_E2E_TESTING') && MGEO_E2E_TESTING) {
        if (isset($_GET['force_location']) && is_string($_GET['force_location']) && !empty($_GET['force_location'])) {
            $forced_location_key = sanitize_text_field(wp_unslash($_GET['force_location']));

            $mocks = [
                'US_CA' => ['continent' => 'North America', 'country' => 'United States', 'country_code' => 'US', 'region' => 'California', 'city' => 'Los Angeles', 'ip' => '1.2.3.4'],
                'GB' => ['continent' => 'Europe', 'country' => 'United Kingdom', 'country_code' => 'GB', 'region' => 'England', 'city' => 'London', 'ip' => '5.6.7.8'],
                'DE' => ['continent' => 'Europe', 'country' => 'Germany', 'country_code' => 'DE', 'region' => 'Berlin', 'city' => 'Berlin', 'ip' => '9.10.11.12'],
                // Add more predefined mocks as needed for testing
            ];

            if (isset($mocks[$forced_location_key])) {
                // Return the mock data directly, bypassing API call and filters below
                return $mocks[$forced_location_key];
            }
        }
    }
    // --- End E2E Testing Debug Mechanism ---


    // Allow tests to short-circuit the process and provide mock data
    $pre_result = apply_filters('pre_mgeo_get_geolocation_data', null);
    if ($pre_result !== null) {
        // Allow tests and other code to filter the final result even when pre-filtered
        return apply_filters('mgeo_location_data_result', $pre_result);
    }

    mgeo_verify_nonce();

    $request_limiter = new mgeo_RequestLimiter();
    if (!$request_limiter->can_make_request()) {
        return new WP_Error(
            "request_limit_exceeded",
            "Monthly API request limit exceeded"
        );
    }

    $ipDetection = new mgeo_IpDetection();
    $ip = $ipDetection->getRequestIP();
    // $ip = "86.94.131.20"; // DEBUG: Keep commented out unless actively debugging
    $cached_data = get_transient("mgeo_geo_location_{$ip}");
    if ($cached_data) {
        return $cached_data;
    }

    $api = new mgeo_MakiPluginsApi();
    $data = $api->get_location($ip);

    if ($data) {
        $request_limiter->increment_counter();
        set_transient("mgeo_geo_location_{$ip}", $data, HOUR_IN_SECONDS);
    }

    // Allow tests and other code to filter the final result
    return apply_filters('mgeo_location_data_result', $data);
}
