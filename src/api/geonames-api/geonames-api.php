<?php
if (!defined("ABSPATH")) {
    exit();
}

class mgeo_GeoNamesApi
{
    private $username;
    private $base_url = "http://api.geonames.org"; // Note: free geonames API has a limit of 20k requests per month

    public function __construct()
    {
        $this->username = "mancato";
    }

    public function search_cities($search_term, $max_rows = 10)
    {
        if (!$this->username) {
            return false;
        }

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
            return [];
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!isset($data["geonames"])) {
            return [];
        }

        // Transform the response to match our expected format
        return array_values(array_unique(
            array_map(
                function ($city) {
                    return $city["name"];
                }, $data["geonames"]
            )
        ));
    }
}
