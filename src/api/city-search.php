<?php
if (!defined("ABSPATH")) {
    exit();
}

add_action("rest_api_init", function () {
    register_rest_route("maki-geo/v1", "/city-search", [
        "methods" => "GET",
        "callback" => "mgeo_search_cities",
        "permission_callback" => "__return_true",
        "args" => [
            "search" => [
                "required" => true,
                "type" => "string",
                "sanitize_callback" => "sanitize_text_field",
            ],
        ],
    ]);
});

function mgeo_search_cities($request)
{
    $nonce_check = mgeo_verify_nonce();
    if (is_wp_error($nonce_check)) {
        return $nonce_check; // Return the WP_Error directly
    }

    $search_term = $request->get_param("search");

    if (strlen($search_term) < 2) {
        return ["cities" => []];
    }

    // Check transient cache first
    $cache_key = "mgeo_city_search_" . md5($search_term);
    $cached_results = get_transient($cache_key);

    if ($cached_results !== false) {
        return ["cities" => $cached_results];
    }

    // Use the cities cache manager to search
    $cities_manager = mgeo_CitiesCacheManager::get_instance();
    $results = $cities_manager->search_cities($search_term);

    // Cache results for 1 hour
    set_transient($cache_key, $results, HOUR_IN_SECONDS);

    return ["cities" => $results];
}
