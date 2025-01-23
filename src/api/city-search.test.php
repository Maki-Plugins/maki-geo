<?php

class TestCitySearch extends WP_UnitTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        // Clear any existing transients
        global $wpdb;
        $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient%'");

        // Mock the nonce verification
        add_filter('mgeo_verify_nonce', '__return_true');
    }

    public function test_city_search()
    {
        $mock_cities = ['Paris'];

        // Mock the GeoNames API response
        add_filter(
            'pre_http_request', function ($preempt, $args, $url) use ($mock_cities) {
                if (strpos($url, 'api.geonames.org') !== false) {
                    return [
                    'response' => ['code' => 200],
                    'body' => wp_json_encode(
                        [
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
                        ]
                    )
                    ];
                }
                return $preempt;
            }, 10, 3
        );

        $request = new WP_REST_Request('GET', '/maki-geo/v1/city-search');
        $request->set_param('search', 'Paris');

        $response = mgeo_search_cities($request);

        $this->assertArrayHasKey('cities', $response);
        $this->assertEquals($mock_cities, $response['cities']);

        // Verify the results were cached
        $cache_key = 'mgeo_city_search_' . md5('Paris');
        $cached_data = get_transient($cache_key);
        $this->assertEquals($mock_cities, $cached_data);
    }

    public function test_city_search_from_cache()
    {
        $cached_cities = ['Paris'];

        $cache_key = 'mgeo_city_search_' . md5('Paris');
        set_transient($cache_key, $cached_cities, HOUR_IN_SECONDS);

        $request = new WP_REST_Request('GET', '/maki-geo/v1/city-search');
        $request->set_param('search', 'Paris');

        $response = mgeo_search_cities($request);

        $this->assertArrayHasKey('cities', $response);
        $this->assertEquals($cached_cities, $response['cities']);
    }

    public function test_city_search_api_error()
    {
        // Mock API error
        add_filter(
            'pre_http_request', function ($preempt, $args, $url) {
                if (strpos($url, 'api.geonames.org') !== false) {
                    return new WP_Error('http_request_failed', 'API request failed');
                }
                return $preempt;
            }, 10, 3
        );

        $request = new WP_REST_Request('GET', '/maki-geo/v1/city-search');
        $request->set_param('search', 'Paris');

        $response = mgeo_search_cities($request);

        $this->assertInstanceOf('WP_Error', $response);
        $this->assertEquals('city_search_failed', $response->get_error_code());
    }
}
