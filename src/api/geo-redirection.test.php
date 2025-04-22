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
}
