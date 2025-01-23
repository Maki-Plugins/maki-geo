<?php
if (!defined('ABSPATH')) {
    exit;
}

class mgeo_GeoNamesAPI {
    private $username;
    private $base_url = 'http://api.geonames.org';

    public function __construct($username = null) {
        $this->username = $username ?? get_option('mgeo_geonames_username');
    }

    public function search_cities($search_term, $max_rows = 10) {
        if (!$this->username) {
            return false;
        }

        $url = $this->base_url . '/searchJSON?' . http_build_query([
            'q' => $search_term,
            'maxRows' => $max_rows,
            'username' => $this->username,
            'cities' => 'cities1000', // Only cities with population > 1000
            'type' => 'json',
            'style' => 'FULL'
        ]);

        $response = wp_remote_get($url);

        if (is_wp_error($response)) {
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!isset($data['geonames'])) {
            return false;
        }

        // Transform the response to match our expected format
        return array_map(function($city) {
            return [
                'label' => sprintf('%s, %s, %s', 
                    $city['name'],
                    $city['adminName1'],
                    $city['countryName']
                ),
                'value' => $city['name']
            ];
        }, $data['geonames']);
    }
}
