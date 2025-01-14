<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action(
    'rest_api_init', function () {
        register_rest_route(
            'maki-geo/v1', '/location', array(
                'methods' => 'GET',
                'callback' => 'mgeo_get_geolocation_data',
                'permission_callback' => '__return_true',
            )
        );
    }
);

function mgeo_get_geolocation_data()
{
    mgeo_verify_nonce();
    $ipDetection = new mgeo_IpDetection();
    $ip = $ipDetection->getRequestIP();
    $cached_data = get_transient("mgeo_geo_location_{$ip}");
    if ($cached_data) {
        return $cached_data;
    }

    $response = wp_remote_get("https://api.makiplugins.com/maki-geo/api/v1/getLocation?ip={$ip}");
    if (is_wp_error($response)) {
        return false;
    }

    $responseObject = json_decode(wp_remote_retrieve_body($response), true);
    // TODO: Check for errors here

    $data = $responseObject['data'];
    set_transient("mgeo_geo_location_{$ip}", $data, HOUR_IN_SECONDS);
    return $data;
}
