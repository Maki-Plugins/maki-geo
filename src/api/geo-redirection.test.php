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

}
