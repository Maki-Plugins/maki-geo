<?php

class TestLocation extends WP_UnitTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        // Clear any existing transients
        global $wpdb;
        $wpdb->query(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient%'"
        );

        // Mock the nonce verification
        add_filter('mgeo_verify_nonce', '__return_true');
    }

    public function test_geolocation_data_from_api()
    {
        // Mock the API response
        $mock_data = [
        "continent" => "Europe",
        "country" => "France",
        "region" => "Île-de-France",
        "city" => "Paris",
        ];

        // Add filter to mock wp_remote_get response
        add_filter(
            "pre_http_request",
            function ($preempt, $args, $url) use ($mock_data) {
                if (strpos($url, 'makiplugins.com') !== false) {
                    return [
                        "response" => ["code" => 200],
                        "body" => wp_json_encode(["data" => $mock_data])
                    ];
                }
                return $preempt;
            },
            10,
            3
        );
        
        $result = mgeo_get_geolocation_data();
        
        $this->assertEquals($mock_data, $result);
        $this->assertIsArray($result);
        $this->assertEquals($mock_data, $result);

        // Verify the data was cached
        $cached_data = get_transient("mgeo_geo_location_86.94.131.20");
        $this->assertEquals($mock_response["data"], $cached_data);
    }

    public function test_geolocation_data_from_cache()
    {
        $cached_data = [
            "continent" => "Europe",
            "country" => "France",
            "region" => "Île-de-France",
            "city" => "Paris",
        ];

        // Set the cached data
        set_transient(
            "mgeo_geo_location_127.0.0.1",
            $cached_data,
            HOUR_IN_SECONDS
        );

        // Add filter to ensure wp_remote_get is not called
        add_filter(
            "pre_http_request",
            function ($preempt, $args, $url) {
                if (strpos($url, 'makiplugins.com') !== false) {
                    $this->fail(
                        "wp_remote_get should not be called when data is cached"
                    );
                    return false;
                }
            },
            10,
            3
        );

        $result = mgeo_get_geolocation_data();

        $this->assertEquals($cached_data, $result);
    }

    public function test_geolocation_data_api_error()
    {
        // Add filter to simulate API error
        add_filter(
            "pre_http_request",
            function ($preempt, $args, $url) {
                
                if (strpos($url, 'makiplugins.com') !== false) {
                    return new WP_Error(
                        "http_request_failed",
                        "API request failed"
                    );
                }
            },
            10,
            3
        );

        $result = mgeo_get_geolocation_data();

        $this->assertFalse($result);

        // Verify no cache was set
        $cached_data = get_transient("mgeo_geo_location_86.94.131.20");
        $this->assertFalse($cached_data);
    }
}
