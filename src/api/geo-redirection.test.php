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

    /**
     * Test permissions for the PUT /redirections/{id} endpoint.
     */
    public function test_update_redirection_api_permissions()
    {
        // Test with a non-admin user (subscriber)
        wp_set_current_user($this->subscriber_user_id);
        $request = new WP_REST_Request('PUT', '/maki-geo/v1/redirections/some_id');
        $request->set_url_params(['id' => 'some_id']);
        $request->set_body_params(['name' => 'Attempt by subscriber']); // Need some body data
        $response = $this->server->dispatch($request);
        $this->assertEquals(403, $response->get_status(), 'Subscriber should receive a 403 Forbidden status when trying to update.');
    }

    /**
     * Test successful update of a redirection.
     */
    public function test_update_redirection_api_success()
    {
        wp_set_current_user($this->admin_user_id);

        // Add initial redirection
        $initial_redirection_id = 'red_test123';
        $initial_redirection = [
            'id' => $initial_redirection_id,
            'isEnabled' => true,
            'name' => 'Initial Name',
            'locations' => [
                [
                    'id' => 'loc_abc',
                    'conditions' => [['type' => 'country', 'value' => 'US', 'operator' => 'is']],
                    'operator' => 'OR',
                    'pageTargetingType' => 'all',
                    'redirectUrl' => 'https://example.com/initial',
                    'redirectMappings' => [],
                    'exclusions' => [],
                    'passPath' => true,
                    'passQuery' => true,
                ]
            ]
        ];
        update_option('mgeo_redirections', [$initial_redirection]);

        // Prepare updated data
        $updated_data = $initial_redirection; // Start with initial data
        $updated_data['name'] = 'Updated Name';
        $updated_data['isEnabled'] = false;
        $updated_data['locations'][0]['redirectUrl'] = 'https://example.com/updated';

        $request = new WP_REST_Request('PUT', '/maki-geo/v1/redirections/' . $initial_redirection_id);
        $request->set_url_params(['id' => $initial_redirection_id]);
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode($updated_data));

        $response = $this->server->dispatch($request);
        $data = $response->get_data();

        $this->assertEquals(200, $response->get_status(), 'Response status should be 200 OK.');
        $this->assertTrue($data['success'], 'Response should indicate success.');
        $this->assertArrayHasKey('redirection', $data, 'Response should contain the updated redirection.');
        $this->assertEquals($updated_data, $data['redirection'], 'Response redirection data should match the updated data.');

        // Verify option storage
        $stored_redirections = get_option('mgeo_redirections');
        $this->assertIsArray($stored_redirections);
        $this->assertCount(1, $stored_redirections);
        $this->assertEquals($updated_data, $stored_redirections[0], 'Stored redirection should match the updated data.');
    }

    /**
     * Test updating a redirection that does not exist.
     */
    public function test_update_redirection_api_not_found()
    {
        wp_set_current_user($this->admin_user_id);
        delete_option('mgeo_redirections'); // Ensure it's empty

        $non_existent_id = 'red_nonexistent';
        $update_data = [
            'id' => $non_existent_id,
            'isEnabled' => true,
            'name' => 'Trying to update non-existent',
            'locations' => [ /* ... valid location data ... */
                [
                    'id' => 'loc_xyz',
                    'conditions' => [['type' => 'country', 'value' => 'GB', 'operator' => 'is']],
                    'operator' => 'OR',
                    'pageTargetingType' => 'all',
                    'redirectUrl' => 'https://example.co.uk',
                    'redirectMappings' => [],
                    'exclusions' => [],
                    'passPath' => true,
                    'passQuery' => true,
                ]
            ]
        ];

        $request = new WP_REST_Request('PUT', '/maki-geo/v1/redirections/' . $non_existent_id);
        $request->set_url_params(['id' => $non_existent_id]);
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode($update_data));

        $response = $this->server->dispatch($request);
        $data = $response->get_data();

        $this->assertEquals(404, $response->get_status(), 'Response status should be 404 Not Found.');
        $this->assertFalse($data['success'], 'Response should indicate failure.');
        $this->assertArrayHasKey('message', $data, 'Response should contain an error message.');
    }

    /**
     * Test updating a redirection with invalid data.
     */
    public function test_update_redirection_api_invalid_data()
    {
        wp_set_current_user($this->admin_user_id);

        // Add initial redirection
        $initial_redirection_id = 'red_test456';
        $initial_redirection = [
            'id' => $initial_redirection_id,
            'isEnabled' => true,
            'name' => 'Valid Initial',
            'locations' => [
                [
                    'id' => 'loc_def',
                    'conditions' => [['type' => 'region', 'value' => 'CA-ON', 'operator' => 'is']],
                    'operator' => 'AND',
                    'pageTargetingType' => 'all',
                    'redirectUrl' => 'https://example.ca/on',
                    'redirectMappings' => [],
                    'exclusions' => [],
                    'passPath' => true,
                    'passQuery' => true,
                ]
            ]
        ];
        update_option('mgeo_redirections', [$initial_redirection]);

        // Prepare invalid update data (missing 'locations')
        $invalid_update_data = [
            'id' => $initial_redirection_id,
            'isEnabled' => false,
            'name' => 'Invalid Update Attempt',
            // 'locations' key is missing
        ];

        $request = new WP_REST_Request('PUT', '/maki-geo/v1/redirections/' . $initial_redirection_id);
        $request->set_url_params(['id' => $initial_redirection_id]);
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode($invalid_update_data));

        $response = $this->server->dispatch($request);
        $data = $response->get_data();

        $this->assertEquals(400, $response->get_status(), 'Response status should be 400 Bad Request.');
        $this->assertFalse($data['success'], 'Response should indicate failure.');
        $this->assertArrayHasKey('message', $data, 'Response should contain an error message.');

        // Verify option storage is unchanged
        $stored_redirections = get_option('mgeo_redirections');
        $this->assertIsArray($stored_redirections);
        $this->assertCount(1, $stored_redirections);
        $this->assertEquals($initial_redirection, $stored_redirections[0], 'Stored redirection should remain unchanged.');
    }

     /**
     * Test updating a redirection where the ID in the route mismatches the ID in the body.
     */
    public function test_update_redirection_api_id_mismatch()
    {
        wp_set_current_user($this->admin_user_id);

        // Add initial redirection
        $original_id = 'red_original';
        $initial_redirection = [
            'id' => $original_id,
            'isEnabled' => true,
            'name' => 'Original ID',
            'locations' => [
                [
                    'id' => 'loc_ghi',
                    'conditions' => [['type' => 'city', 'value' => 'Paris', 'operator' => 'is']],
                    'operator' => 'OR',
                    'pageTargetingType' => 'all',
                    'redirectUrl' => 'https://example.fr',
                    'redirectMappings' => [],
                    'exclusions' => [],
                    'passPath' => true,
                    'passQuery' => true,
                ]
            ]
        ];
        update_option('mgeo_redirections', [$initial_redirection]);
        wp_cache_flush(); // <-- Add cache flush here

        // Prepare update data with a different ID in the body
        $mismatched_data = $initial_redirection;
        $mismatched_data['id'] = 'red_different'; // ID in body is different
        $mismatched_data['name'] = 'Mismatched ID Attempt';

        // Request targets the original ID in the route
        $request = new WP_REST_Request('PUT', '/maki-geo/v1/redirections/' . $original_id);
        $request->set_url_params(['id' => $original_id]);
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode($mismatched_data)); // Body contains 'red_different'

        $response = $this->server->dispatch($request);
        $data = $response->get_data();

        $this->assertEquals(400, $response->get_status(), 'Response status should be 400 Bad Request due to ID mismatch.');
        $this->assertFalse($data['success'], 'Response should indicate failure.');
        $this->assertArrayHasKey('message', $data, 'Response should contain an error message about ID mismatch.');

        // Verify option storage is unchanged
        $stored_redirections = get_option('mgeo_redirections');
        $this->assertIsArray($stored_redirections);
        $this->assertCount(1, $stored_redirections);
        $this->assertEquals($initial_redirection, $stored_redirections[0], 'Stored redirection should remain unchanged after ID mismatch attempt.');
    }

    /**
     * Test permissions for the DELETE /redirections/{id} endpoint.
     */
    public function test_delete_redirection_api_permissions()
    {
        // Test with a non-admin user (subscriber)
        wp_set_current_user($this->subscriber_user_id);
        $request = new WP_REST_Request('DELETE', '/maki-geo/v1/redirections/some_id');
        $request->set_url_params(['id' => 'some_id']);
        $response = $this->server->dispatch($request);
        $this->assertEquals(403, $response->get_status(), 'Subscriber should receive a 403 Forbidden status when trying to delete.');
    }

    /**
     * Test successful deletion of a redirection.
     */
    public function test_delete_redirection_api_success()
    {
        wp_set_current_user($this->admin_user_id);

        // Add initial redirections
        $id_to_delete = 'red_todelete';
        $id_to_keep = 'red_tokeep';
        $redirection_to_delete = [
            'id' => $id_to_delete,
            'name' => 'Delete Me',
            'isEnabled' => true,
            'locations' => [/* minimal valid location */ ['id' => 'loc_del', 'conditions' => [['type' => 'ip', 'value' => '1.1.1.1', 'operator' => 'is']], 'operator' => 'OR', 'pageTargetingType' => 'all', 'redirectUrl' => '/deleted']]
        ];
        $redirection_to_keep = [
            'id' => $id_to_keep,
            'name' => 'Keep Me',
            'isEnabled' => true,
            'locations' => [/* minimal valid location */ ['id' => 'loc_keep', 'conditions' => [['type' => 'country', 'value' => 'FR', 'operator' => 'is']], 'operator' => 'OR', 'pageTargetingType' => 'all', 'redirectUrl' => '/kept']]
        ];
        update_option('mgeo_redirections', [$redirection_to_delete, $redirection_to_keep]);

        // Dispatch DELETE request
        $request = new WP_REST_Request('DELETE', '/maki-geo/v1/redirections/' . $id_to_delete);
        $request->set_url_params(['id' => $id_to_delete]);
        $response = $this->server->dispatch($request);
        $data = $response->get_data();

        $this->assertEquals(200, $response->get_status(), 'Response status should be 200 OK for successful deletion.');
        $this->assertTrue($data['success'], 'Response should indicate success.');

        // Verify option storage
        $stored_redirections = get_option('mgeo_redirections');
        $this->assertIsArray($stored_redirections, 'Stored option should still be an array.');
        $this->assertCount(1, $stored_redirections, 'Stored option should contain only one redirection after deletion.');
        $this->assertEquals($id_to_keep, $stored_redirections[0]['id'], 'The remaining redirection should be the one intended to be kept.');
        $this->assertEquals($redirection_to_keep, $stored_redirections[0], 'The remaining redirection data should match the one intended to be kept.');
    }

    /**
     * Test deleting a redirection that does not exist.
     */
    public function test_delete_redirection_api_not_found()
    {
        wp_set_current_user($this->admin_user_id);

        // Add an existing redirection
        $existing_id = 'red_exists';
        $existing_redirection = [
            'id' => $existing_id,
            'name' => 'I Exist',
            'isEnabled' => true,
            'locations' => [/* minimal valid location */ ['id' => 'loc_exist', 'conditions' => [['type' => 'country', 'value' => 'DE', 'operator' => 'is']], 'operator' => 'OR', 'pageTargetingType' => 'all', 'redirectUrl' => '/exists']]
        ];
        update_option('mgeo_redirections', [$existing_redirection]);

        $non_existent_id = 'red_nonexistent';

        // Dispatch DELETE request for non-existent ID
        $request = new WP_REST_Request('DELETE', '/maki-geo/v1/redirections/' . $non_existent_id);
        $request->set_url_params(['id' => $non_existent_id]);
        $response = $this->server->dispatch($request);
        $data = $response->get_data();

        $this->assertEquals(404, $response->get_status(), 'Response status should be 404 Not Found when deleting non-existent ID.');
        $this->assertFalse($data['success'], 'Response should indicate failure.');
        $this->assertArrayHasKey('message', $data, 'Response should contain an error message.');

        // Verify option storage is unchanged
        $stored_redirections = get_option('mgeo_redirections');
        $this->assertIsArray($stored_redirections);
        $this->assertCount(1, $stored_redirections);
        $this->assertEquals($existing_redirection, $stored_redirections[0], 'Stored redirection should remain unchanged.');
    }

    // --- Tests for GET /maki-geo/v1/redirection ---

    /**
     * Test the redirection API when no redirect URL is found.
     */
    public function test_handle_redirection_api_no_redirect()
    {
        $referer_url = 'https://current.example.com/page';
        $_SERVER['HTTP_REFERER'] = $referer_url;

        // Mock mgeo_get_redirect_url_for_request to return null
        $filter_callback = function ($original_result, $url_arg) use ($referer_url) {
            $this->assertEquals($referer_url, $url_arg, 'mgeo_get_redirect_url_for_request called with correct URL');
            return null;
        };
        add_filter('mgeo_get_redirect_url_for_request', $filter_callback, 10, 2);

        $request = new WP_REST_Request('GET', '/maki-geo/v1/redirection');
        $nonce = wp_create_nonce('wp_rest');
        $_SERVER['HTTP_X_WP_NONCE'] = $nonce; // Set server variable directly
        $response = $this->server->dispatch($request);
        unset($_SERVER['HTTP_X_WP_NONCE']); // Clean up server variable
        $data = $response->get_data();

        $this->assertEquals(200, $response->get_status());
        $this->assertEquals(['redirect' => false], $data, 'Response should indicate no redirect.');

        // Clean up
        remove_filter('mgeo_get_redirect_url_for_request', $filter_callback, 10);
        unset($_SERVER['HTTP_REFERER']);
    }

    /**
     * Test the redirection API when a redirect URL is found.
     */
    public function test_handle_redirection_api_redirect_found()
    {
        $referer_url = 'https://current.example.com/another/page?query=1';
        $target_url = 'https://redirect.example.com/target';
        $_SERVER['HTTP_REFERER'] = $referer_url;

        // Ensure mock location data is set for the internal call to mgeo_get_geolocation_data
        $this->set_mock_location_data($this->get_default_mock_location());

        // Mock mgeo_get_redirect_url_for_request to return the target URL
        $filter_callback = function ($original_result, $url_arg) use ($referer_url, $target_url) {
            $this->assertEquals($referer_url, $url_arg, 'mgeo_get_redirect_url_for_request called with correct URL');
            return $target_url;
        };
        add_filter('mgeo_get_redirect_url_for_request', $filter_callback, 10, 2);

        $request = new WP_REST_Request('GET', '/maki-geo/v1/redirection');
        $nonce = wp_create_nonce('wp_rest');
        $_SERVER['HTTP_X_WP_NONCE'] = $nonce; // Set server variable directly
        $response = $this->server->dispatch($request);
        unset($_SERVER['HTTP_X_WP_NONCE']); // Clean up server variable
        $data = $response->get_data();

        $this->assertEquals(200, $response->get_status());
        $this->assertEquals(
            ['redirect' => true, 'url' => $target_url],
            $data,
            'Response should indicate redirect and include the target URL.'
        );

        // Clean up
        remove_filter('mgeo_get_redirect_url_for_request', $filter_callback, 10);
        unset($_SERVER['HTTP_REFERER']);
    }

    /**
     * Test the redirection API when the HTTP_REFERER is missing.
     */
    public function test_handle_redirection_api_no_referer()
    {
        // Ensure referer is not set
        unset($_SERVER['HTTP_REFERER']);

        // We don't even need to mock mgeo_get_redirect_url_for_request as it shouldn't be called

        $request = new WP_REST_Request('GET', '/maki-geo/v1/redirection');
        $nonce = wp_create_nonce('wp_rest');
        $_SERVER['HTTP_X_WP_NONCE'] = $nonce; // Set server variable directly
        $response = $this->server->dispatch($request);
        unset($_SERVER['HTTP_X_WP_NONCE']); // Clean up server variable
        $data = $response->get_data();

        $this->assertEquals(200, $response->get_status());
        $this->assertEquals(['redirect' => false], $data, 'Response should indicate no redirect when referer is missing.');
    }

    /**
     * Test the redirection API when nonce verification fails.
     */
    public function test_handle_redirection_api_nonce_failure()
    {
        // Remove the global bypass for this test
        remove_filter('mgeo_verify_nonce', '__return_true');

        $_SERVER['HTTP_REFERER'] = 'https://current.example.com/page'; // Referer is needed to get past the first check

        $request = new WP_REST_Request('GET', '/maki-geo/v1/redirection');
        // Intentionally do not add a nonce header
        $response = $this->server->dispatch($request);

        $this->assertEquals(403, $response->get_status(), 'Response status should be 403 Forbidden due to nonce failure.');

        // Clean up (tearDown will add the filter back, but good practice if tearDown changed)
        unset($_SERVER['HTTP_REFERER']);
        // No need to add the filter back here, tearDown handles it.
    }

    // --- Tests for Sanitization Functions ---

    /**
     * Helper to get a basic valid redirection structure.
     */
    private function get_valid_redirection_data_base() {
        return [
            'isEnabled' => true,
            'name' => 'Valid Redirect',
            'locations' => [
                [
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
        ];
    }

    /**
     * Test mgeo_sanitize_single_redirection with valid data.
     */
    public function test_sanitize_single_redirection_valid()
    {
        $valid_input = $this->get_valid_redirection_data_base();
        $sanitized = mgeo_sanitize_single_redirection($valid_input);

        $this->assertIsArray($sanitized);
        $this->assertStringStartsWith('red_', $sanitized['id']);
        $this->assertEquals('Valid Redirect', $sanitized['name']);
        $this->assertTrue($sanitized['isEnabled']);
        $this->assertCount(1, $sanitized['locations']);

        $location = $sanitized['locations'][0];
        $this->assertStringStartsWith('loc_', $location['id']);
        $this->assertEquals('OR', $location['operator']);
        $this->assertEquals('all', $location['pageTargetingType']);
        $this->assertEquals('https://example.com/us', $location['redirectUrl']);
        $this->assertCount(1, $location['conditions']);
        $this->assertEquals('country', $location['conditions'][0]['type']);
        $this->assertEquals('US', $location['conditions'][0]['value']);
        $this->assertEquals('is', $location['conditions'][0]['operator']);
        $this->assertEmpty($location['redirectMappings']);
        $this->assertEmpty($location['exclusions']);
        $this->assertTrue($location['passPath']);
        $this->assertTrue($location['passQuery']);

        // Test with specific IDs provided
        $valid_input_with_ids = [
            'id' => 'red_myid',
            'isEnabled' => false,
            'name' => 'Specific ID Redirect',
            'locations' => [
                [
                    'id' => 'loc_myloc',
                    'conditions' => [['type' => 'city', 'value' => 'Tokyo', 'operator' => 'is not']],
                    'operator' => 'AND',
                    'pageTargetingType' => 'specific',
                    'redirectUrl' => '', // Ignored for specific
                    'redirectMappings' => [['id' => 'map_mymap', 'fromUrl' => '/jp', 'toUrl' => 'https://example.jp/tokyo']],
                    'exclusions' => [['id' => 'excl_myexcl', 'type' => 'url_contains', 'value' => 'admin']],
                    'passPath' => false,
                    'passQuery' => false,
                ]
            ]
        ];
        $sanitized_with_ids = mgeo_sanitize_single_redirection($valid_input_with_ids);
        $this->assertEquals('red_myid', $sanitized_with_ids['id']);
        $this->assertEquals('loc_myloc', $sanitized_with_ids['locations'][0]['id']);
        $this->assertEquals('map_mymap', $sanitized_with_ids['locations'][0]['redirectMappings'][0]['id']);
        $this->assertEquals('excl_myexcl', $sanitized_with_ids['locations'][0]['exclusions'][0]['id']);
        $this->assertFalse($sanitized_with_ids['isEnabled']);
        $this->assertEquals('AND', $sanitized_with_ids['locations'][0]['operator']);
        $this->assertEquals('specific', $sanitized_with_ids['locations'][0]['pageTargetingType']);
        $this->assertFalse($sanitized_with_ids['locations'][0]['passPath']);
        $this->assertFalse($sanitized_with_ids['locations'][0]['passQuery']);
    }

    /**
     * Test mgeo_sanitize_single_redirection with invalid data types.
     */
    public function test_sanitize_single_redirection_invalid_types()
    {
        // Top level not an array
        $this->assertNull(mgeo_sanitize_single_redirection("not an array"));

        // isEnabled as string
        $input = $this->get_valid_redirection_data_base();
        $input['isEnabled'] = 'true_string';
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertTrue($sanitized['isEnabled']); // Should cast to true

        $input['isEnabled'] = 'false_string';
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertTrue($sanitized['isEnabled']); // Non-empty string casts to true

        $input['isEnabled'] = '';
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertFalse($sanitized['isEnabled']); // Empty string casts to false

        // locations not an array
        $input = $this->get_valid_redirection_data_base();
        $input['locations'] = "not an array";
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertNull($sanitized, "Redirection should be invalid if locations is not an array");

        // location item not an array
        $input = $this->get_valid_redirection_data_base();
        $input['locations'] = ["not an array"];
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertNull($sanitized, "Redirection should be invalid if a location item is not an array");

        // conditions not an array
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['conditions'] = "not an array";
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertNull($sanitized, "Redirection should be invalid if conditions is not an array");

        // condition item not an array
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['conditions'] = ["not an array"];
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertNull($sanitized, "Redirection should be invalid if a condition item is not an array");

        // redirectMappings not an array
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['pageTargetingType'] = 'specific'; // Need specific for mappings
        $input['locations'][0]['redirectMappings'] = "not an array";
        $sanitized = mgeo_sanitize_single_redirection($input);
        // This case makes the location invalid due to cross-field rule (specific but no valid mappings)
        $this->assertNull($sanitized, "Redirection should be invalid if redirectMappings is not an array");

        // exclusions not an array
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['exclusions'] = "not an array";
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertIsArray($sanitized); // Exclusions being invalid doesn't invalidate the whole rule
        $this->assertEmpty($sanitized['locations'][0]['exclusions']);
    }

    /**
     * Test mgeo_sanitize_single_redirection with invalid enum values.
     */
    public function test_sanitize_single_redirection_invalid_enums()
    {
        // Invalid condition type
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['conditions'][0]['type'] = 'zipcode';
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertEquals('country', $sanitized['locations'][0]['conditions'][0]['type']); // Defaults to country

        // Invalid condition operator
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['conditions'][0]['operator'] = 'contains';
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertEquals('is', $sanitized['locations'][0]['conditions'][0]['operator']); // Defaults to is

        // Invalid location operator
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['operator'] = 'XOR';
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertEquals('OR', $sanitized['locations'][0]['operator']); // Defaults to OR

        // Invalid pageTargetingType
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['pageTargetingType'] = 'homepage';
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertEquals('all', $sanitized['locations'][0]['pageTargetingType']); // Defaults to all

        // Invalid exclusion type
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['exclusions'] = [['type' => 'cookie_present', 'value' => 'test']];
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertEquals('url_equals', $sanitized['locations'][0]['exclusions'][0]['type']); // Defaults to url_equals
    }

    /**
     * Test mgeo_sanitize_single_redirection with empty values for conditions, mappings, exclusions.
     */
    public function test_sanitize_single_redirection_empty_values()
    {
        // Empty condition value
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['conditions'][0]['value'] = '';
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertNull($sanitized, "Redirection should be invalid if the only condition has an empty value");

        // Add a valid condition alongside an empty one
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['conditions'][] = ['type' => 'region', 'value' => '', 'operator' => 'is'];
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertIsArray($sanitized);
        $this->assertCount(1, $sanitized['locations'][0]['conditions'], "Condition with empty value should be removed");
        $this->assertEquals('US', $sanitized['locations'][0]['conditions'][0]['value']);

        // Empty mapping fromUrl
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['pageTargetingType'] = 'specific';
        $input['locations'][0]['redirectMappings'] = [['fromUrl' => '', 'toUrl' => 'https://example.com/a']];
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertNull($sanitized, "Redirection should be invalid if the only mapping has empty fromUrl");

        // Empty mapping toUrl
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['pageTargetingType'] = 'specific';
        $input['locations'][0]['redirectMappings'] = [['fromUrl' => '/a', 'toUrl' => '']];
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertNull($sanitized, "Redirection should be invalid if the only mapping has empty toUrl");

        // Empty exclusion value
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['exclusions'] = [['type' => 'url_contains', 'value' => '']];
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertIsArray($sanitized);
        $this->assertEmpty($sanitized['locations'][0]['exclusions'], "Exclusion with empty value should be removed");
    }

    /**
     * Test mgeo_sanitize_single_redirection cross-field validation rules.
     */
    public function test_sanitize_single_redirection_cross_field_rules()
    {
        // pageTargetingType 'all' requires redirectUrl
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['pageTargetingType'] = 'all';
        $input['locations'][0]['redirectUrl'] = ''; // Invalid state
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertNull($sanitized, "Redirection should be invalid if type is 'all' but redirectUrl is empty");

        // pageTargetingType 'specific' requires redirectMappings
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['pageTargetingType'] = 'specific';
        $input['locations'][0]['redirectUrl'] = 'https://should.be.ignored';
        $input['locations'][0]['redirectMappings'] = []; // Invalid state
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertNull($sanitized, "Redirection should be invalid if type is 'specific' but redirectMappings is empty");

        // Valid 'specific' case
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['pageTargetingType'] = 'specific';
        $input['locations'][0]['redirectUrl'] = '';
        $input['locations'][0]['redirectMappings'] = [['fromUrl' => '/from', 'toUrl' => 'https://to.example.com']];
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertIsArray($sanitized);
        $this->assertEquals('specific', $sanitized['locations'][0]['pageTargetingType']);
        $this->assertCount(1, $sanitized['locations'][0]['redirectMappings']);
    }

    /**
     * Test URL sanitization within mgeo_sanitize_single_redirection.
     */
    public function test_sanitize_single_redirection_url_sanitization()
    {
        // redirectUrl with script
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['redirectUrl'] = 'javascript:alert("XSS")';
        $sanitized = mgeo_sanitize_single_redirection($input);
        // This makes the rule invalid because pageTargetingType 'all' needs a URL, and the URL was sanitized away.
        $this->assertNull($sanitized, "Redirection should be invalid if redirectUrl is sanitized away for 'all' type");


        // redirectUrl with valid but complex URL
        $input = $this->get_valid_redirection_data_base();
        $complex_url = 'https://user:pass@example.com:8080/path/to/page?query=val&q2=v2#fragment';
        $input['locations'][0]['redirectUrl'] = $complex_url;
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertEquals($complex_url, $sanitized['locations'][0]['redirectUrl'], "Valid complex URL should pass esc_url_raw");

        // mapping toUrl with script
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['pageTargetingType'] = 'specific';
        $input['locations'][0]['redirectUrl'] = '';
        $input['locations'][0]['redirectMappings'] = [['fromUrl' => '/safe', 'toUrl' => 'javascript:alert("XSS")']];
        $sanitized = mgeo_sanitize_single_redirection($input);
        // The mapping itself becomes invalid because toUrl is empty after sanitization
        $this->assertNull($sanitized, "Redirection should be invalid if mapping toUrl is sanitized away");

        // mapping fromUrl (relative path, should be kept by sanitize_text_field)
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['pageTargetingType'] = 'specific';
        $input['locations'][0]['redirectUrl'] = '';
        $input['locations'][0]['redirectMappings'] = [['fromUrl' => '../relative/path', 'toUrl' => 'https://example.com/target']];
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertIsArray($sanitized);
        $this->assertEquals('../relative/path', $sanitized['locations'][0]['redirectMappings'][0]['fromUrl']);

        // mapping fromUrl with html (should be stripped by sanitize_text_field)
        $input = $this->get_valid_redirection_data_base();
        $input['locations'][0]['pageTargetingType'] = 'specific';
        $input['locations'][0]['redirectUrl'] = '';
        $input['locations'][0]['redirectMappings'] = [['fromUrl' => '/path<script>alert("bad")</script>', 'toUrl' => 'https://example.com/target']];
        $sanitized = mgeo_sanitize_single_redirection($input);
        $this->assertIsArray($sanitized);
        // Update assertion: sanitize_text_field removes script content too
        $this->assertEquals('/path', $sanitized['locations'][0]['redirectMappings'][0]['fromUrl']);
    }


    /**
     * Test mgeo_sanitize_redirections with a mix of valid and invalid inputs.
     */
    public function test_sanitize_redirections_valid_and_invalid()
    {
        $valid_redir = $this->get_valid_redirection_data_base();
        $valid_redir['id'] = 'red_valid'; // Give it an ID for identification

        $invalid_redir_1 = $this->get_valid_redirection_data_base();
        $invalid_redir_1['locations'][0]['conditions'][0]['value'] = ''; // Invalid condition

        $invalid_redir_2 = $this->get_valid_redirection_data_base();
        $invalid_redir_2['locations'] = "not an array"; // Invalid structure

        $input_array = [
            $invalid_redir_1,
            $valid_redir,
            $invalid_redir_2,
        ];

        $sanitized_array = mgeo_sanitize_redirections($input_array);

        $this->assertIsArray($sanitized_array);
        $this->assertCount(1, $sanitized_array, "Only the valid redirection should remain");
        $this->assertEquals('red_valid', $sanitized_array[0]['id'], "The remaining redirection should be the valid one");
        // Deep check one field to be sure it's the sanitized version
        $this->assertEquals('https://example.com/us', $sanitized_array[0]['locations'][0]['redirectUrl']);
    }

    /**
     * Test mgeo_sanitize_redirections with empty array input.
     */
    public function test_sanitize_redirections_empty_input()
    {
        $sanitized_array = mgeo_sanitize_redirections([]);
        $this->assertIsArray($sanitized_array);
        $this->assertEmpty($sanitized_array);
    }

    /**
     * Test mgeo_sanitize_redirections with non-array input.
     */
    public function test_sanitize_redirections_non_array_input()
    {
        $this->assertEquals([], mgeo_sanitize_redirections(null));
        $this->assertEquals([], mgeo_sanitize_redirections("a string"));
        $this->assertEquals([], mgeo_sanitize_redirections(123));
    }
}
