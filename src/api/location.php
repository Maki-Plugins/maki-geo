<?php
if (!defined("ABSPATH")) {
    exit();
}

add_action(
    "rest_api_init", function () {
        register_rest_route(
            "maki-geo/v1", "/location", [
            "methods" => "GET",
            "callback" => "mgeo_get_geolocation_data",
            "permission_callback" => "__return_true",
            ]
        );
    }
);

function mgeo_get_geolocation_data()
{
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

    return $data;
}
