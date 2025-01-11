<?php

class TestLocation extends WP_UnitTestCase
{
    public function setUp(): void
    {
         parent::setUp();
         // Clear any existing transients
         global $wpdb;
         $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient%'");
    }

    public function test_debug_data_structure()   
    {
        $debug_data = get_debug_data();
         
        $this->assertIsArray($debug_data);        
        $this->assertArrayHasKey(
            'continent',     
            $debug_data
        );
        $this->assertArrayHasKey(
            'country_code',  
            $debug_data
        );
        $this->assertArrayHasKey(
            'country',       
            $debug_data
        );
        $this->assertArrayHasKey(
            'region',        
            $debug_data
        );
        $this->assertArrayHasKey(
            'city', 
            $debug_data
        );
         
        $this->assertEquals(
            'Europe', 
            $debug_data['continent']
        );
        $this->assertEquals(
            'FR', 
            $debug_data['country_code']
        );
        $this->assertEquals(
            'France', 
            $debug_data['country']
        );
        $this->assertEquals(
            'Île-de-France',      
            $debug_data['region']
        );
        $this->assertEquals(
            'Paris', 
            $debug_data['city']
        );
    }

    public function test_debug_ip()
    {
        $ip = get_debug_ip();
        $this->assertEquals('86.94.131.20', $ip); 
        $this->assertMatchesRegularExpression(
            '/^ 
 {1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/', $ip
        );        
    }

    public function 
    test_geolocation_data_from_api()
    {
        // Mock the API response
        $mock_response = [
            'data' => [
                'continent' => 'Europe',
                'country' => 'France',
                'region' => 'Île-de-France',      
                'city' => 'Paris'
            ]
        ];

        // Add filter to mock wp_remote_get response
        add_filter(
            'pre_http_request', 
            function ($preempt, $args, $url) use 
                ($mock_response) {
                 return [
                     'response' => ['code' => 200],    
                     'body' => 
                json_encode($mock_response)
                 ];
            }, 10, 3
        );

        $result = get_geolocation_data();

        $this->assertIsArray($result);
        $this->assertEquals(
            $mock_response['data'], $result
        );

        // Verify the data was cached
        $cached_data = 
        get_transient('geo_location_86.94.131.20');       
        $this->assertEquals(
            $mock_response['data'],
            $cached_data
        );
    }

    public function test_geolocation_data_from_cache()
    {
        $cached_data = [
            'continent' => 'Europe',
            'country' => 'France',
            'region' => 'Île-de-France',
            'city' => 'Paris'
        ];

        // Set the cached data
        set_transient(
            'geo_location_86.94.131.20',
            $cached_data, HOUR_IN_SECONDS
        );

        // Add filter to ensure wp_remote_get is  
        not called
        add_filter(
            'pre_http_request', 
            function ($preempt, $args, $url) {
                $this->fail(
                    'wp_remote_get should not 
     be called when data is cached'
                );
                        return false;
            }, 10, 3
        );

        $result = get_geolocation_data();

        $this->assertEquals($cached_data, $result);
    }

    public function 
    test_geolocation_data_api_error()
    {
        // Add filter to simulate API error       
        add_filter(
            'pre_http_request', 
            function ($preempt, $args, $url) {
                 return new 
                WP_Error(
                    'http_request_failed', 'API request      
     failed'
                );
            }, 10, 3
        );

        $result = get_geolocation_data();

        $this->assertFalse($result);
         
        // Verify no cache was set
        $cached_data = get_transient('geo_location_86.94.131.20');       
        $this->assertFalse($cached_data);
    }
}
