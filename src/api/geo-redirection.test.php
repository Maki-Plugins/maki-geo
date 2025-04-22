<?php
/**
 * Tests for the Geo Redirection API endpoints and sanitization.
 *
 * @package Maki_Geo
 */

// Ensure the test helper trait is available if needed for location mocking later
require_once dirname(__DIR__, 2) . '/phpunit/test-helpers/MockLocationHelper.php';

class TestGeoRedirectionApi extends WP_UnitTestCase
{
    use MockLocationHelper; // Include if location data might be needed indirectly

    protected $server;
    protected $admin_user_id;
    protected $subscriber_user_id;

    public function setUp(): void
    {
        parent::setUp();
        $this->start_mocking_location(); // Start mocking location data if needed
        $this->reset_location_static_cache();

        // Set up the REST server
        global $wp_rest_server;
        $this->server = $wp_rest_server = new WP_REST_Server();
        do_action('rest_api_init');

        // Create users with different roles
        $this->admin_user_id = $this->factory->user->create(['role' => 'administrator']);
        $this->subscriber_user_id = $this->factory->user->create(['role' => 'subscriber']);

        // Clear relevant options before each test
        delete_option('mgeo_redirections');

        // Mock nonce verification for simplicity in most API tests (can be overridden)
        // Individual tests can remove this filter if they specifically test nonce failure
        add_filter('mgeo_verify_nonce', '__return_true');
    }

    public function tearDown(): void
    {
        // Remove the nonce filter
        remove_filter('mgeo_verify_nonce', '__return_true');

        // Clean up options and users
        delete_option('mgeo_redirections');
        wp_delete_user($this->admin_user_id);
        wp_delete_user($this->subscriber_user_id);

        // Reset REST server
        global $wp_rest_server;
        $wp_rest_server = null;

        $this->stop_mocking_location();
        parent::tearDown();
    }

    // --- Test methods will be added below ---

    /**
     * Test permissions for the GET /redirections endpoint.
     */
    public function test_get_redirections_api_permissions()
    {
        // 1. Test with a non-admin user (subscriber)
        wp_set_current_user($this->subscriber_user_id);
        $request = new WP_REST_Request('GET', '/maki-geo/v1/redirections');
        $response = $this->server->dispatch($request);
        $this->assertEquals(403, $response->get_status(), 'Subscriber should receive a 403 Forbidden status.'); // Or 401 depending on exact permission check

        // 2. Test with an admin user
        wp_set_current_user($this->admin_user_id);
        $request = new WP_REST_Request('GET', '/maki-geo/v1/redirections');
        $response = $this->server->dispatch($request);
        $this->assertEquals(200, $response->get_status(), 'Admin should receive a 200 OK status.');
    }

    /**
     * Test successful retrieval of redirections.
     */
    public function test_get_redirections_api_success()
    {
        wp_set_current_user($this->admin_user_id);

        // Mock the option data
        $mock_redirections = [
            [
                'id' => 'red_1',
                'isEnabled' => true,
                'name' => 'Test Redirect 1',
                'locations' => [
                    [
                        'id' => 'loc_1',
                        'conditions' => [['type' => 'country', 'value' => 'US', 'operator' => 'is']],
                        'operator' => 'OR',
                        'pageTargetingType' => 'all',
                        'redirectUrl' => 'https://example.com/us',
                        'redirectMappings' => [],
                        'exclusions' => [],
                        'passPath' => true,
                        'passQuery' => true,
                    ]
                ]
            ],
            [
                'id' => 'red_2',
                'isEnabled' => false,
                'name' => 'Test Redirect 2',
                'locations' => [
                    [
                        'id' => 'loc_2',
                        'conditions' => [['type' => 'city', 'value' => 'London', 'operator' => 'is not']],
                        'operator' => 'AND',
                        'pageTargetingType' => 'specific',
                        'redirectUrl' => '',
                        'redirectMappings' => [['id' => 'map_1', 'fromUrl' => '/about', 'toUrl' => 'https://example.co.uk/about-us']],
                        'exclusions' => [['id' => 'excl_1', 'type' => 'url_contains', 'value' => 'admin']],
                        'passPath' => false,
                        'passQuery' => false,
                    ]
                ]
            ]
        ];
        update_option('mgeo_redirections', $mock_redirections);

        $request = new WP_REST_Request('GET', '/maki-geo/v1/redirections');
        $response = $this->server->dispatch($request);
        $data = $response->get_data();

        $this->assertEquals(200, $response->get_status());
        $this->assertEquals($mock_redirections, $data, 'Response data should match the mocked option data.');

        // Clean up the option
        delete_option('mgeo_redirections');
    }

    /**
     * Test retrieval when no redirections are set.
     */
    public function test_get_redirections_api_empty()
    {
        wp_set_current_user($this->admin_user_id);

        // Ensure the option is empty or false
        delete_option('mgeo_redirections');
        // Or explicitly set to empty array: update_option('mgeo_redirections', []);

        $request = new WP_REST_Request('GET', '/maki-geo/v1/redirections');
        $response = $this->server->dispatch($request);
        $data = $response->get_data();

        $this->assertEquals(200, $response->get_status());
        $this->assertEquals([], $data, 'Response data should be an empty array when no redirections exist.');
    }

    /**
     * Test permissions for the POST /redirections endpoint.
     */
    public function test_create_redirection_api_permissions()
    {
        // Test with a non-admin user (subscriber)
        wp_set_current_user($this->subscriber_user_id);
        $request = new WP_REST_Request('POST', '/maki-geo/v1/redirections');
        $request->set_body_params(['name' => 'Attempt by subscriber']); // Need some body data
        $response = $this->server->dispatch($request);
        $this->assertEquals(403, $response->get_status(), 'Subscriber should receive a 403 Forbidden status when trying to create.');
    }

    /**
     * Test successful creation of a redirection.
     */
    public function test_create_redirection_api_success()
    {
        wp_set_current_user($this->admin_user_id);

        $new_redirection_data = [
            // No 'id' provided here, should be generated
            'isEnabled' => true,
            'name' => 'New Test Redirect',
            'locations' => [
                [
                    // No 'id' provided here, should be generated
                    'conditions' => [['type' => 'country', 'value' => 'CA', 'operator' => 'is']],
                    'operator' => 'OR',
                    'pageTargetingType' => 'all',
                    'redirectUrl' => 'https://example.ca/welcome',
                    'redirectMappings' => [],
                    'exclusions' => [],
                    'passPath' => true,
                    'passQuery' => true,
                ]
            ]
        ];

        $request = new WP_REST_Request('POST', '/maki-geo/v1/redirections');
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode($new_redirection_data)); // Use set_body for JSON

        $response = $this->server->dispatch($request);
        $data = $response->get_data();

        $this->assertEquals(201, $response->get_status(), 'Response status should be 201 Created.');
        $this->assertTrue($data['success'], 'Response should indicate success.');
        $this->assertArrayHasKey('redirection', $data, 'Response should contain the created redirection.');

        $created_redirection = $data['redirection'];
        $this->assertIsString($created_redirection['id'], 'Created redirection should have an ID.');
        $this->assertStringStartsWith('red_', $created_redirection['id'], 'Redirection ID should start with "red_".');
        $this->assertEquals($new_redirection_data['name'], $created_redirection['name'], 'Redirection name should match input.');
        $this->assertEquals($new_redirection_data['isEnabled'], $created_redirection['isEnabled'], 'Redirection isEnabled should match input.');
        $this->assertCount(1, $created_redirection['locations'], 'Created redirection should have one location.');
        $this->assertStringStartsWith('loc_', $created_redirection['locations'][0]['id'], 'Location ID should start with "loc_".');
        $this->assertEquals($new_redirection_data['locations'][0]['conditions'], $created_redirection['locations'][0]['conditions'], 'Location conditions should match input.');

        // Verify option storage
        $stored_redirections = get_option('mgeo_redirections');
        $this->assertIsArray($stored_redirections, 'Stored option should be an array.');
        $this->assertCount(1, $stored_redirections, 'Stored option should contain one redirection.');
        // Compare the stored redirection with the one returned in the response
        $this->assertEquals($created_redirection, $stored_redirections[0], 'Stored redirection should match the response redirection.');
    }

    /**
     * Test creation attempt with invalid data.
     */
    public function test_create_redirection_api_invalid_data()
    {
        wp_set_current_user($this->admin_user_id);

        // Invalid data: Missing 'locations' array entirely
        $invalid_data_1 = [
            'isEnabled' => true,
            'name' => 'Invalid Redirect - No Locations',
        ];

        $request1 = new WP_REST_Request('POST', '/maki-geo/v1/redirections');
        $request1->set_header('Content-Type', 'application/json');
        $request1->set_body(wp_json_encode($invalid_data_1));
        $response1 = $this->server->dispatch($request1);
        $data1 = $response1->get_data();

        $this->assertEquals(400, $response1->get_status(), 'Response status should be 400 Bad Request for missing locations.');
        $this->assertFalse($data1['success'], 'Response should indicate failure for missing locations.');
        $this->assertArrayHasKey('message', $data1, 'Response should contain an error message for missing locations.');

        // Invalid data: Location with empty 'conditions' array
        $invalid_data_2 = [
            'isEnabled' => true,
            'name' => 'Invalid Redirect - Empty Conditions',
            'locations' => [
                [
                    'conditions' => [], // Invalid - must have conditions
                    'operator' => 'OR',
                    'pageTargetingType' => 'all',
                    'redirectUrl' => 'https://example.com/fail',
                    'redirectMappings' => [],
                    'exclusions' => [],
                    'passPath' => true,
                    'passQuery' => true,
                ]
            ]
        ];

        $request2 = new WP_REST_Request('POST', '/maki-geo/v1/redirections');
        $request2->set_header('Content-Type', 'application/json');
        $request2->set_body(wp_json_encode($invalid_data_2));
        $response2 = $this->server->dispatch($request2);
        $data2 = $response2->get_data();

        $this->assertEquals(400, $response2->get_status(), 'Response status should be 400 Bad Request for empty conditions.');
        $this->assertFalse($data2['success'], 'Response should indicate failure for empty conditions.');
        $this->assertArrayHasKey('message', $data2, 'Response should contain an error message for empty conditions.');


        // Verify option storage is still empty
        $stored_redirections = get_option('mgeo_redirections');
        $this->assertEmpty($stored_redirections, 'Stored option should remain empty after invalid attempts.');
    }
}
