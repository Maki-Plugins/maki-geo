<?php

require_once 'utils.php';

add_action(
    'rest_api_init', function () {
        register_rest_route(
            'maki-geo/v1', '/location', array(
            'methods' => 'GET',
            'callback' => 'get_geolocation_data',
            )
        );
    }
);

function get_debug_data()
{
    return array(
        'continent' => 'Europe',
        'country' => 'France',
        'region' => 'Île-de-France',
        'city' => 'Paris'
    );
}

function get_debug_ip()
{
    return "86.94.131.20";
}


function get_geolocation_data()
{
    verify_nonce();
    $ip = get_debug_ip(); //$_SERVER['REMOTE_ADDR'];
    $cached_data = get_transient("geo_location_{$ip}");
    if ($cached_data) {
        return $cached_data;
    }

    $response = wp_remote_get("https://ipinfo.io/{$ip}/json"); // ?token=YOUR_API_KEY
    if (is_wp_error($response)) {
        return false;
    }

    $data = json_decode(wp_remote_retrieve_body($response), true);
    set_transient("geo_location_{$ip}", $data, HOUR_IN_SECONDS);
    return $data;
}
