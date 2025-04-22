<?php
/**
 * Tests for API utility functions.
 *
 * @package Maki_Geo
 */

class TestApiUtils extends WP_UnitTestCase
{
    protected $admin_user_id;
    protected $subscriber_user_id;

    public function setUp(): void
    {
        parent::setUp();
        // Create users with different roles
        $this->admin_user_id = $this->factory->user->create(['role' => 'administrator']);
        $this->subscriber_user_id = $this->factory->user->create(['role' => 'subscriber']);
    }

    public function tearDown(): void
    {
        // Clean up users
        wp_delete_user($this->admin_user_id);
        wp_delete_user($this->subscriber_user_id);
        parent::tearDown();
    }

    // --- Test methods will be added below ---

    /**
     * Test mgeo_can_manage_rules function.
     */
    public function test_mgeo_can_manage_rules()
    {
        // Test case 1: Admin user
        wp_set_current_user($this->admin_user_id);
        $this->assertTrue(mgeo_can_manage_rules(), 'Admin should be able to manage rules.');

        // Test case 2: Subscriber user
        wp_set_current_user($this->subscriber_user_id);
        $this->assertFalse(mgeo_can_manage_rules(), 'Subscriber should not be able to manage rules.');

        // Test case 3: Logged out user
        wp_set_current_user(0);
        $this->assertFalse(mgeo_can_manage_rules(), 'Logged out user should not be able to manage rules.');
    }

    /**
     * Test mgeo_verify_nonce function with a valid nonce.
     */
    public function test_mgeo_verify_nonce_success()
    {
        $nonce = wp_create_nonce('wp_rest');
        $_SERVER['HTTP_X_WP_NONCE'] = $nonce;

        $result = mgeo_verify_nonce();
        $this->assertNull($result, 'Valid nonce should not return an error.');

        // Clean up server variable
        unset($_SERVER['HTTP_X_WP_NONCE']);
    }

    /**
     * Test mgeo_verify_nonce function with an invalid nonce.
     */
    public function test_mgeo_verify_nonce_failure_invalid()
    {
        $_SERVER['HTTP_X_WP_NONCE'] = 'invalid-nonce';

        $result = mgeo_verify_nonce();
        $this->assertInstanceOf(WP_Error::class, $result, 'Invalid nonce should return a WP_Error.');
        $this->assertEquals('rest_forbidden', $result->get_error_code(), 'Error code should be rest_forbidden.');
        $this->assertEquals(403, $result->get_error_data()['status'], 'Status code should be 403.');

        // Clean up server variable
        unset($_SERVER['HTTP_X_WP_NONCE']);
    }

    /**
     * Test mgeo_verify_nonce function when the nonce header is missing.
     */
    public function test_mgeo_verify_nonce_failure_missing()
    {
        // Ensure the header is not set
        if (isset($_SERVER['HTTP_X_WP_NONCE'])) {
            unset($_SERVER['HTTP_X_WP_NONCE']);
        }

        $result = mgeo_verify_nonce();
        $this->assertInstanceOf(WP_Error::class, $result, 'Missing nonce header should return a WP_Error.');
        $this->assertEquals('rest_forbidden', $result->get_error_code(), 'Error code should be rest_forbidden.');
        $this->assertEquals(403, $result->get_error_data()['status'], 'Status code should be 403.');
    }
}
