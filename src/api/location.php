<?php
if (!defined('ABSPATH')) {
    exit;
}

require_once 'api-utils.php';

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

function mgeo_get_debug_data()
{
    return array(
        'continent' => 'Europe',
        'country_code' => "FR",
        'country' => 'France',
        'region' => 'Île-de-France',
        'city' => 'Paris'
    );
}

function mgeo_get_debug_ip()
{
    return "86.94.131.20";
}


function mgeo_get_geolocation_data()
{
    mgeo_verify_nonce();
    $ip = mgeo_get_debug_ip(); //$_SERVER['REMOTE_ADDR'];
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
