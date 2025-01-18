<?php

class TestMakiPluginsAPI extends WP_UnitTestCase {
    private $api;

    public function setUp(): void {
        parent::setUp();
        $this->api = new mgeo_MakiPluginsAPI('test_key');
    }

    public function test_get_location() {
        $mock_data = [
            'continent' => 'Europe',
            'country' => 'France',
            'region' => 'Île-de-France',
            'city' => 'Paris',
        ];

        // Mock API response
        add_filter('pre_http_request', function($preempt, $args, $url) use ($mock_data) {
            if (strpos($url, 'getLocation') !== false) {
                return [
                    'response' => ['code' => 200],
                    'body' => wp_json_encode(['data' => $mock_data])
                ];
            }
            return $preempt;
        }, 10, 3);

        $result = $this->api->get_location('127.0.0.1');
        $this->assertEquals($mock_data, $result);
    }

    public function test_get_location_error() {
        // Mock API error
        add_filter('pre_http_request', function($preempt, $args, $url) {
            if (strpos($url, 'getLocation') !== false) {
                return new WP_Error('http_request_failed', 'API request failed');
            }
            return $preempt;
        }, 10, 3);

        $result = $this->api->get_location('127.0.0.1');
        $this->assertFalse($result);
    }

    public function test_verify_key() {
        $mock_response = [
            'valid' => true,
            'monthly_limit' => 5000,
            'requests_this_month' => 250
        ];

        // Mock API response
        add_filter('pre_http_request', function($preempt, $args, $url) use ($mock_response) {
            if (strpos($url, 'verifyKey') !== false) {
                return [
                    'response' => ['code' => 200],
                    'body' => wp_json_encode($mock_response)
                ];
            }
            return $preempt;
        }, 10, 3);

        $result = $this->api->verify_key();
        $this->assertEquals($mock_response, $result);
    }

    public function test_verify_key_no_key() {
        $api = new mgeo_MakiPluginsAPI();
        $result = $api->verify_key();
        $this->assertFalse($result);
    }

    public function test_verify_key_error() {
        // Mock API error
        add_filter('pre_http_request', function($preempt, $args, $url) {
            if (strpos($url, 'verifyKey') !== false) {
                return new WP_Error('http_request_failed', 'API request failed');
            }
            return $preempt;
        }, 10, 3);

        $result = $this->api->verify_key();
        $this->assertFalse($result);
    }
}
