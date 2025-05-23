<?php

class TestCitySearch extends WP_UnitTestCase
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
    private function do_search_cities($request)
    {
        $nonce = wp_create_nonce("wp_rest");
        $_SERVER["HTTP_X_WP_NONCE"] = $nonce; // Set server variable directly
        $response = mgeo_search_cities($request);
        unset($_SERVER["HTTP_X_WP_NONCE"]); // Clean up server variable
        return $response;
    }

    public function test_city_search_minimum_length()
    {
        $request = new WP_REST_Request("GET", "/maki-geo/v1/city-search");
        $request->set_param("search", "a");

        $response = $this->do_search_cities($request);

        $this->assertArrayHasKey("cities", $response);
        $this->assertEmpty($response["cities"]);
    }

    public function test_city_search()
    {
        $request = new WP_REST_Request("GET", "/maki-geo/v1/city-search");
        $request->set_param("search", "new yor");

        $response = $this->do_search_cities($request);

        $this->assertArrayHasKey("cities", $response);
        $this->assertNotEmpty($response["cities"]);
        $this->assertContains("New York City", $response["cities"]);

        // Verify the results were cached
        $cache_key = "mgeo_city_search_" . md5("new yor");
        $cached_data = get_transient($cache_key);
        $this->assertEquals($response["cities"], $cached_data);
    }

    public function test_city_search_from_cache()
    {
        $cached_cities = ["New York", "Newport"];
        $cache_key = "mgeo_city_search_" . md5("new");
        set_transient($cache_key, $cached_cities, HOUR_IN_SECONDS);

        $request = new WP_REST_Request("GET", "/maki-geo/v1/city-search");
        $request->set_param("search", "new");

        $response = $this->do_search_cities($request);

        $this->assertArrayHasKey("cities", $response);
        $this->assertEquals($cached_cities, $response["cities"]);
    }

    public function test_empty_search_term()
    {
        $request = new WP_REST_Request("GET", "/maki-geo/v1/city-search");
        $request->set_param("search", "");

        $response = $this->do_search_cities($request);
        $this->assertEquals(["cities" => []], $response);
    }

    public function test_exact_prefix_match_priority()
    {
        $request = new WP_REST_Request("GET", "/maki-geo/v1/city-search");
        $request->set_param("search", "san f");

        $response = $this->do_search_cities($request);

        $this->assertArrayHasKey("cities", $response);
        $this->assertNotEmpty($response["cities"]);

        // San Francisco should appear before other "San" cities
        if (in_array("San Francisco", $response["cities"])) {
            $this->assertEquals("San Francisco", $response["cities"][0]);
        }
    }
}
