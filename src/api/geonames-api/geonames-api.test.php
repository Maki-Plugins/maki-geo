<?php

class TestGeoNamesAPI extends WP_UnitTestCase {
    private $api;

    public function setUp(): void {
        parent::setUp();
        $this->api = new mgeo_GeoNamesAPI("test_username");
    }

    public function test_search_cities() {
        $mock_response = [
            'geonames' => [
                [
                    'name' => 'Paris',
                    'adminName1' => 'Île-de-France',
                    'countryName' => 'France'
                ],
                [
                    'name' => 'Paris',
                    'adminName1' => 'Texas',
                    'countryName' => 'United States'
                ]
            ]
        ];

        // Mock API response
        add_filter('pre_http_request', function($preempt, $args, $url) use ($mock_response) {
            if (strpos($url, 'api.geonames.org') !== false) {
                return [
                    'response' => ['code' => 200],
                    'body' => wp_json_encode($mock_response)
                ];
            }
            return $preempt;
        }, 10, 3);

        $result = $this->api->search_cities('Paris');
        
        $this->assertCount(2, $result);
        $this->assertEquals('Paris, Île-de-France, France', $result[0]['label']);
        $this->assertEquals('Paris', $result[0]['value']);
    }

    public function test_search_cities_no_username() {
        $api = new mgeo_GeoNamesAPI();
        $result = $api->search_cities('Paris');
        $this->assertFalse($result);
    }

    public function test_search_cities_error() {
        // Mock API error
        add_filter('pre_http_request', function($preempt, $args, $url) {
            if (strpos($url, 'api.geonames.org') !== false) {
                return new WP_Error('http_request_failed', 'API request failed');
            }
            return $preempt;
        }, 10, 3);

        $result = $this->api->search_cities('Paris');
        $this->assertFalse($result);
    }
}
