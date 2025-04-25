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
        add_filter("mgeo_verify_nonce", "__return_true");
    }

    /**
     * Set a nonce and do an api request. Helper so we don't have to keep setting the nonce every time.
     */
    private function do_get_geolocation_data()
    {
        $nonce = wp_create_nonce("wp_rest");
        $_SERVER["HTTP_X_WP_NONCE"] = $nonce; // Set server variable directly
        $response = mgeo_get_geolocation_data();
        unset($_SERVER["HTTP_X_WP_NONCE"]); // Clean up server variable
        return $response;
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
                if (strpos($url, "makiplugins.com") !== false) {
                    return [
                        "response" => ["code" => 200],
                        "body" => wp_json_encode(["data" => $mock_data]),
                    ];
                }
                return $preempt;
            },
            10,
            3
        );

        $result = $this->do_get_geolocation_data();

        $this->assertIsArray(
            $result,
            "Expected geolocation data to be an array"
        );
        $this->assertEquals($mock_data, $result);

        // Verify the data was cached using the expected IP from the test environment
        $ipDetection = new mgeo_IpDetection();
        $expected_ip = $ipDetection->getRequestIP(); // Should be 127.0.0.1 in test env
        $cached_data = get_transient("mgeo_geo_location_{$expected_ip}");
        $this->assertEquals($mock_data, $cached_data);
    }

    public function test_geolocation_data_from_cache()
    {
        $cached_data = [
            "continent" => "Europe",
            "country" => "France",
            "region" => "Île-de-France",
            "city" => "Paris",
        ];

        // Set the cached data using the expected IP from the test environment
        $ipDetection = new mgeo_IpDetection();
        $expected_ip = $ipDetection->getRequestIP(); // Should be 127.0.0.1 in test env
        set_transient(
            "mgeo_geo_location_{$expected_ip}",
            $cached_data,
            HOUR_IN_SECONDS
        );

        // Add filter to ensure wp_remote_get is not called
        add_filter(
            "pre_http_request",
            function ($preempt, $args, $url) {
                if (strpos($url, "makiplugins.com") !== false) {
                    $this->fail(
                        "wp_remote_get should not be called when data is cached"
                    );
                    return false;
                }
            },
            10,
            3
        );

        $result = $this->do_get_geolocation_data();

        $this->assertEquals($cached_data, $result);
    }

    public function test_geolocation_data_api_error()
    {
        // Add filter to simulate API error
        add_filter(
            "pre_http_request",
            function ($preempt, $args, $url) {
                if (strpos($url, "makiplugins.com") !== false) {
                    return new WP_Error(
                        "http_request_failed",
                        "API request failed"
                    );
                }
            },
            10,
            3
        );

        $result = $this->do_get_geolocation_data();

        $this->assertFalse($result);

        // Verify no cache was set for the expected IP
        $ipDetection = new mgeo_IpDetection();
        $expected_ip = $ipDetection->getRequestIP(); // Should be 127.0.0.1 in test env
        $cached_data = get_transient("mgeo_geo_location_{$expected_ip}");
        $this->assertFalse($cached_data);
    }
}
