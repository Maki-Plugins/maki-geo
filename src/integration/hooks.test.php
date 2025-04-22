<?php
/**
 * Integration tests for WordPress hooks used by Maki Geo.
 *
 * @package Maki_Geo
 */

class TestHooksIntegration extends WP_UnitTestCase
{
    public function setUp(): void
    {
        parent::setUp();
        // Reset relevant options or states before each test
        delete_option('mgeo_client_server_mode');
        delete_option('mgeo_redirections');
        // Ensure hooks are added by including the relevant files if not already done by bootstrap
        // require_once MGEO_PATH . 'src/geo-redirection/geo-redirection-backend.php'; // Assumed loaded
        // require_once MGEO_PATH . 'src/geo-redirection/geo-redirection-frontend.php'; // Assumed loaded

        // Reset script queue for enqueue tests more thoroughly
        global $wp_scripts;
        $wp_scripts = new WP_Scripts();
    }

    public function tearDown(): void
    {
        // Clean up options
        delete_option('mgeo_client_server_mode');
        delete_option('mgeo_redirections');

        // Remove filters
        remove_filter('wp_redirect', [$this, 'capture_redirect'], 10);
        remove_filter('pre_mgeo_get_redirect_url_for_request', '__return_null');
        remove_filter('pre_mgeo_get_redirect_url_for_request', [$this, 'mock_redirect_url']);
        remove_filter('wp_doing_ajax', '__return_true');
        remove_filter('wp_doing_ajax', '__return_false');
        remove_filter('pre_option_mgeo_redirections', [$this, 'mock_get_redirections_non_empty']);
        remove_filter('pre_option_mgeo_redirections', '__return_empty_array');
        remove_filter('pre_mgeo_url_has_potential_redirections', '__return_true');
        remove_filter('pre_mgeo_url_has_potential_redirections', '__return_false', 99); // Remove with correct priority
        remove_filter('pre_mgeo_get_current_url', [$this, 'mock_get_current_url']);


        // Reset admin screen
        set_current_screen(null);

        // Reset script queue again just in case (though setUp should handle it)
        global $wp_scripts;
        $wp_scripts = new WP_Scripts();

        parent::tearDown();
    }

    private $redirect_location = null;
    private $redirect_status = null;
    private $redirect_called = false;

    /**
     * Helper to capture wp_redirect arguments and prevent actual redirect.
     */
    public function capture_redirect($location, $status)
    {
        $this->redirect_called = true;
        $this->redirect_location = $location;
        $this->redirect_status = $status;
        // Do NOT return false here. Let the redirect proceed (test framework handles exit).
        // return false;
    }

    /**
     * Helper to mock the redirect URL via filter.
     */
    public function mock_redirect_url($url)
    {
        return 'https://server.redirect/path';
    }

    /**
     * Helper to mock mgeo_get_redirections returning a non-empty array.
     */
    public function mock_get_redirections_non_empty($value)
    {
        // Return a minimal valid redirection structure
        return [
            [
                'id' => 'redir1',
                'isEnabled' => true,
                'name' => 'Test Redirect',
                'locations' => [
                    [
                        'id' => 'loc1',
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
            ]
        ];
    }

    /**
     * Helper to mock mgeo_get_current_url.
     */
    public function mock_get_current_url($url)
    {
        return 'http://example.test/some-page';
    }


    // --- Test methods ---

    /**
     * Test that the redirection hook is registered correctly.
     */
    public function test_template_redirect_hook_registered()
    {
        // Priority 1 is set in geo-redirection-backend.php
        $this->assertEquals(1, has_action('template_redirect', 'mgeo_init_geo_redirection'));
    }

    /**
     * Test that server-side redirection occurs when conditions are met.
     */
    public function test_server_redirect_occurs()
    {
        update_option('mgeo_client_server_mode', 'server');
        set_current_screen('front'); // Simulate non-admin
        add_filter('wp_doing_ajax', '__return_false');
        add_filter('pre_mgeo_get_redirect_url_for_request', [$this, 'mock_redirect_url']);
        add_filter('pre_mgeo_get_current_url', [$this, 'mock_get_current_url']);
        remove_action('template_redirect', 'redirect_canonical');

        // Add the redirect capture filter right before the action
        add_filter('wp_redirect', [$this, 'capture_redirect'], 10, 2);

        // Trigger the hook
        do_action('template_redirect');

        // Remove the filter immediately after
        remove_filter('wp_redirect', [$this, 'capture_redirect'], 10);
        add_action('template_redirect', 'redirect_canonical'); // Add back canonical redirect

        $this->assertTrue($this->redirect_called, 'wp_redirect should have been called.');
        $this->assertEquals('https://server.redirect/path', $this->redirect_location);
        $this->assertEquals(302, $this->redirect_status); // Default status
    }

    /**
     * Test that server-side redirection does not occur if no matching URL is found.
     */
    public function test_server_redirect_no_match()
    {
        update_option('mgeo_client_server_mode', 'server');
        set_current_screen('front'); // Simulate non-admin
        add_filter('wp_doing_ajax', '__return_false');
        add_filter('pre_mgeo_get_redirect_url_for_request', '__return_null'); // No redirect URL
        remove_action('template_redirect', 'redirect_canonical'); // <-- Add this

        // Trigger the hook
        do_action('template_redirect');

        add_action('template_redirect', 'redirect_canonical'); // <-- Optional: Add back

        $this->assertFalse($this->redirect_called, 'wp_redirect should not have been called.');
    }

    /**
     * Test that server-side redirection is skipped when in client mode.
     */
    public function test_server_redirect_skipped_in_client_mode()
    {
        update_option('mgeo_client_server_mode', 'client'); // Key change: client mode
        set_current_screen('front');
        add_filter('wp_doing_ajax', '__return_false');
        // Add filter that *would* cause redirect, to ensure mode check works
        add_filter('pre_mgeo_get_redirect_url_for_request', [$this, 'mock_redirect_url']);
        remove_action('template_redirect', 'redirect_canonical'); // <-- Add this

        // Trigger the hook
        do_action('template_redirect');

        add_action('template_redirect', 'redirect_canonical'); // <-- Optional: Add back

        $this->assertFalse($this->redirect_called, 'wp_redirect should not have been called in client mode.');
    }

    /**
     * Test that server-side redirection is skipped in the admin area.
     */
    public function test_server_redirect_skipped_in_admin()
    {
        update_option('mgeo_client_server_mode', 'server');
        set_current_screen('dashboard'); // Key change: simulate admin
        add_filter('wp_doing_ajax', '__return_false');
        add_filter('pre_mgeo_get_redirect_url_for_request', [$this, 'mock_redirect_url']);

        // Trigger the hook
        do_action('template_redirect');

        $this->assertFalse($this->redirect_called, 'wp_redirect should not have been called in admin.');
    }

    /**
     * Test that server-side redirection is skipped during AJAX requests.
     */
    public function test_server_redirect_skipped_in_ajax()
    {
        update_option('mgeo_client_server_mode', 'server');
        set_current_screen('front');
        add_filter('wp_doing_ajax', '__return_true'); // Key change: simulate AJAX
        add_filter('pre_mgeo_get_redirect_url_for_request', [$this, 'mock_redirect_url']);
        remove_action('template_redirect', 'redirect_canonical'); // <-- Add this

        // Trigger the hook
        do_action('template_redirect');

        add_action('template_redirect', 'redirect_canonical'); // <-- Optional: Add back

        $this->assertFalse($this->redirect_called, 'wp_redirect should not have been called during AJAX.');
    }

    // --- Tests for wp_enqueue_scripts hook (mgeo_add_client_side_redirection) ---

    /**
     * Test that the client script hook is registered correctly.
     */
    public function test_client_script_hook_registered()
    {
        // Default priority is 10
        $this->assertEquals(10, has_action('wp_enqueue_scripts', 'mgeo_add_client_side_redirection'));
    }

    /**
     * Test that the client script is enqueued in client mode with valid conditions.
     */
    public function test_client_script_enqueued_in_client_mode()
    {
        update_option('mgeo_client_server_mode', 'client');
        set_current_screen('front'); // Not admin
        add_filter('pre_option_mgeo_redirections', [$this, 'mock_get_redirections_non_empty']);
        add_filter('pre_mgeo_url_has_potential_redirections', '__return_true');
        add_filter('pre_mgeo_get_current_url', [$this, 'mock_get_current_url']); // Needed by potential check

        // Trigger the hook
        do_action('wp_enqueue_scripts');

        $this->assertTrue(wp_script_is('mgeo-client-redirection', 'enqueued'), 'Client script should be enqueued.');
    }

    /**
     * Test that the client script is NOT enqueued in server mode.
     */
    public function test_client_script_not_enqueued_in_server_mode()
    {
        update_option('mgeo_client_server_mode', 'server'); // Key change: server mode
        set_current_screen('front');
        add_filter('pre_option_mgeo_redirections', [$this, 'mock_get_redirections_non_empty']);
        add_filter('pre_mgeo_url_has_potential_redirections', '__return_true');
        add_filter('pre_mgeo_get_current_url', [$this, 'mock_get_current_url']);

        // Trigger the hook
        wp_cache_flush(); // Flush cache before action
        do_action('wp_enqueue_scripts');

        $this->assertFalse(wp_script_is('mgeo-client-redirection', 'enqueued'), 'Client script should NOT be enqueued in server mode.');
    }

    /**
     * Test that the client script is NOT enqueued in the admin area.
     */
    public function test_client_script_not_enqueued_in_admin()
    {
        // Define WP_ADMIN constant to properly simulate admin context
        if (!defined('WP_ADMIN')) {
            define('WP_ADMIN', true);
        }

        update_option('mgeo_client_server_mode', 'client');
        set_current_screen('dashboard'); // Key change: admin area
        add_filter('pre_option_mgeo_redirections', [$this, 'mock_get_redirections_non_empty']);
        add_filter('pre_mgeo_url_has_potential_redirections', '__return_true');
        add_filter('pre_mgeo_get_current_url', [$this, 'mock_get_current_url']);

        // Trigger the hook
        wp_cache_flush(); // Flush cache before action
        do_action('wp_enqueue_scripts');

        $this->assertFalse(wp_script_is('mgeo-client-redirection', 'enqueued'), 'Client script should NOT be enqueued in admin.');
    }

    /**
     * Test that the client script is NOT enqueued if there are no redirections.
     */
    public function test_client_script_not_enqueued_if_no_redirections()
    {
        update_option('mgeo_client_server_mode', 'client');
        set_current_screen('front');
        add_filter('pre_option_mgeo_redirections', '__return_empty_array'); // Key change: no redirections
        add_filter('pre_mgeo_url_has_potential_redirections', '__return_true');
        add_filter('pre_mgeo_get_current_url', [$this, 'mock_get_current_url']);

        // Trigger the hook
        wp_cache_flush(); // Flush cache before action
        do_action('wp_enqueue_scripts');

        $this->assertFalse(wp_script_is('mgeo-client-redirection', 'enqueued'), 'Client script should NOT be enqueued if no redirections exist.');
    }

    /**
     * Test that the client script is NOT enqueued if the URL has no potential redirections.
     */
    public function test_client_script_not_enqueued_if_no_potential_url_match()
    {
        update_option('mgeo_client_server_mode', 'client');
        set_current_screen('front');
        add_filter('pre_option_mgeo_redirections', [$this, 'mock_get_redirections_non_empty']);
        // Use high priority to ensure filter applies
        add_filter('pre_mgeo_url_has_potential_redirections', '__return_false', 99); // Key change: no potential match
        add_filter('pre_mgeo_get_current_url', [$this, 'mock_get_current_url']);

        // Trigger the hook
        wp_cache_flush(); // Flush cache before action
        do_action('wp_enqueue_scripts');

        $this->assertFalse(wp_script_is('mgeo-client-redirection', 'enqueued'), 'Client script should NOT be enqueued if URL has no potential redirections.');
    }
}
