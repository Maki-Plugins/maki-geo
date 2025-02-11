<?php
if (!defined("ABSPATH")) {
    exit();
}

add_action(
    'rest_api_init', function () {
        register_rest_route(
            'maki-geo/v1', '/city-search', [
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
            ]
        );
    }
);

function similar_text_custom($str1, $str2) {
    $str1 = strtolower($str1);
    $str2 = strtolower($str2);
    similar_text($str1, $str2, $percent);
    return $percent;
}

function mgeo_search_cities($request)
{
    mgeo_verify_nonce();

    $search_term = $request->get_param('search');
    
    // Check cache first
    $cache_key = 'mgeo_city_search_' . md5($search_term);
    $cached_results = get_transient($cache_key);
    
    if ($cached_results !== false) {
        return ['cities' => $cached_results];
    }

    // Load and search the cities file
    $cities_file = plugin_dir_path(__FILE__) . '../../src/assets/cities500_updated.txt';
    
    if (!file_exists($cities_file)) {
        if (defined('MGEO_DEBUG')) {
            error_log('Cities file not found: ' . $cities_file);
        }
        return ['cities' => []];
    }

    $file_handle = fopen($cities_file, 'r');
    $matches = [];
    $similarity_threshold = 60; // Minimum similarity percentage
    
    if ($file_handle) {
        while (($line = fgets($file_handle)) !== false) {
            $parts = explode("\t", trim($line));
            if (empty($parts[0])) continue;
            
            $city_name = $parts[0];
            $similarity = similar_text_custom($search_term, $city_name);
            
            if ($similarity >= $similarity_threshold) {
                $matches[] = [
                    'name' => $city_name,
                    'similarity' => $similarity
                ];
            }
        }
        fclose($file_handle);
    }

    // Sort by similarity (highest first) and limit results
    usort($matches, function($a, $b) {
        return $b['similarity'] <=> $a['similarity'];
    });

    $results = array_slice(
        array_map(function($match) { return $match['name']; }, $matches),
        0,
        10
    );

    // Cache results for 1 hour
    set_transient($cache_key, $results, HOUR_IN_SECONDS);

    return ['cities' => $results];
}
