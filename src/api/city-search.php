<?php
if (!defined("ABSPATH")) {
    exit();
}

add_action('rest_api_init', function() {
    register_rest_route('maki-geo/v1', '/city-search', [
        'methods' => 'GET',
        'callback' => 'mgeo_search_cities',
        'permission_callback' => '__return_true',
        'args' => [
            'search' => [
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field'
            ]
        ]
    ]);
});

function mgeo_search_cities($request) {
    mgeo_verify_nonce();

    $search_term = $request->get_param('search');
    
    // Check cache first
    $cache_key = 'mgeo_city_search_' . md5($search_term);
    $cached_results = get_transient($cache_key);
    
    if ($cached_results !== false) {
        return ['cities' => $cached_results];
    }

    $api = new mgeo_GeoNamesAPI();
    $results = $api->search_cities($search_term);

    if ($results === false) {
        return new WP_Error(
            'city_search_failed',
            'Failed to search cities',
            ['status' => 500]
        );
    }

    // Cache results for 1 hour
    set_transient($cache_key, $results, HOUR_IN_SECONDS);

    return ['cities' => $results];
}
