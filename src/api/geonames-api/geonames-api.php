<?php
if (!defined("ABSPATH")) {
    exit();
}

class mgeo_GeoNamesApi
{
    private $username = "mancato";
    private $base_url = "http://api.geonames.org"; // Note: free geonames API has a limit of 20k requests per month

    public function __construct()
    {
    }

    public function search_cities($search_term, $max_rows = 10)
    {
        // Docs: https://www.geonames.org/export/geonames-search.html
        $url =
            $this->base_url .
            "/searchJSON?" .
            http_build_query(
                [
                "q" => $search_term,
                "maxRows" => $max_rows,
                "username" => $this->username,
                "cities" => "cities1000", // Only cities with population > 1000
                "type" => "json",
                "style" => "SHORT",
                "featureClass" => "P",
                "fuzzy" => "0" // Lower = more fuzziness
                ]
            );

        $response = wp_remote_get($url);

        if (is_wp_error($response)) {
            error_log('Geonames API error: ' . $response->get_error_message());
            return new \WP_Error('api_error', 'Failed to fetch city data', $response->get_error_message());
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);


        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('JSON decode error: ' . json_last_error_msg());
            return new \WP_Error('json_error', 'Invalid API response format');
        }

        if (!isset($data["geonames"])) {
            return [];
        }

        // Transform the response to match our expected format
        return array_values(
            array_unique(
                array_map(
                    fn($city) => $city["name"], $data["geonames"]
                )
            )
        );
    }
}
