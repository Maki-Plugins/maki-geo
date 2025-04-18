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
