<?php

class TestRequestLimiter extends WP_UnitTestCase
{
    private $request_limiter;
    private $test_time;

    public function setUp(): void
    {
        parent::setUp();
        $this->request_limiter = new mgeo_RequestLimiter();
        $this->test_time = strtotime("2024-01-15"); // Fixed test date

        // Clean up any existing options
        delete_option("mgeo_monthly_requests");
        delete_option("mgeo_last_reset");
        delete_option("mgeo_request_limit");
        delete_option("mgeo_api_key");
        delete_option("mgeo_client_server_mode");
    }

    public function test_free_tier_limit()
    {
        $this->assertEquals(1000, $this->request_limiter->get_request_limit());
    }

    public function test_increment_counter()
    {
        $this->request_limiter->increment_counter();
        $this->assertEquals(1, get_option("mgeo_monthly_requests"));

        $this->request_limiter->increment_counter();
        $this->assertEquals(2, get_option("mgeo_monthly_requests"));
    }

    public function test_can_make_request()
    {
        // Set counter close to limit
        update_option("mgeo_monthly_requests", 999);
        $this->assertTrue($this->request_limiter->can_make_request());

        // Set counter at limit
        update_option("mgeo_monthly_requests", 1000);
        $this->assertFalse($this->request_limiter->can_make_request());
    }

    public function test_monthly_reset()
    {
        // Set initial state
        update_option("mgeo_monthly_requests", 500);
        update_option("mgeo_last_reset", strtotime("2024-01-01"));

        // Mock current time to next month
        $next_month = strtotime("2024-02-01");
        $this->request_limiter->check_monthly_reset($next_month);

        // Counter should be reset
        $this->assertEquals(0, get_option("mgeo_monthly_requests"));
        $this->assertEquals($next_month, get_option("mgeo_last_reset"));
    }

    public function test_api_sync()
    {
        // Set up API key
        update_option("mgeo_api_key", "test_key");

        // Mock API response
        add_filter(
            "pre_http_request",
            function ($preempt, $args, $url) {
                return [
                    "response" => ["code" => 200],
                    "body" => wp_json_encode(
                        [
                        "data" => [
                            "valid" => true,
                            "monthly_limit" => 5000,
                            "requests_this_month" => 250,
                        ],
                        ]
                    ),
                ];
            },
            10,
            3
        );

        $result = $this->request_limiter->sync_with_api();

        $this->assertTrue($result);
        $this->assertEquals(5000, get_option("mgeo_request_limit"));
        $this->assertEquals(250, get_option("mgeo_monthly_requests"));
    }

    public function test_api_sync_invalid_key()
    {
        // Set up invalid API key
        update_option("mgeo_api_key", "invalid_key");

        // Mock API response for invalid key
        add_filter(
            "pre_http_request",
            function ($preempt, $args, $url) {
                return [
                    "response" => ["code" => 200],
                    "body" => wp_json_encode(
                        [
                        "data" => [
                            "valid" => false,
                        ],
                        ]
                    ),
                ];
            },
            10,
            3
        );

        $result = $this->request_limiter->sync_with_api();

        $this->assertFalse($result);
        // Should maintain default values
        $this->assertEquals(1000, $this->request_limiter->get_request_limit());
    }

    public function test_api_sync_error()
    {
        // Set up API key
        update_option("mgeo_api_key", "test_key");

        // Mock API error response
        add_filter(
            "pre_http_request",
            function ($preempt, $args, $url) {
                return new WP_Error(
                    "http_request_failed",
                    "API request failed"
                );
            },
            10,
            3
        );

        $result = $this->request_limiter->sync_with_api();

        $this->assertFalse($result);
        // Should maintain default values
        $this->assertEquals(1000, $this->request_limiter->get_request_limit());
    }
}
