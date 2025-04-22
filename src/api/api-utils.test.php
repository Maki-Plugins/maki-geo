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

}
