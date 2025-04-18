<?php
/**
 * Test cases for geo printing shortcode logic (both modes).
 * Tests functions in src/shortcodes/print-geo-shortcodes.php
 *
 * @package Maki_Geo
 */

// We don't need to mock WP functions anymore, wp-env provides them.
// We will control behavior using options and filters.

class TestGeoPrintingShortcodes extends WP_UnitTestCase
{
    use MockLocationHelper;

    public function setUp(): void
    {
        parent::setUp();
        $this->start_mocking_location();
        $this->reset_location_static_cache(); // Ensure clean static cache for each test

        // Set default mode to server-side for most tests initially
        update_option('mgeo_client_server_mode', 'server');
    }

    public function tearDown(): void
    {
        $this->stop_mocking_location();
        // Clean up options
        delete_option('mgeo_client_server_mode');
        parent::tearDown();
    }

    // --- Tests for mgeo_shortcode_handler ---

    public function test_shortcode_handler_server_mode_success()
    {
        update_option('mgeo_client_server_mode', 'server');
        $result = mgeo_shortcode_handler([], "", "mgeo_country");
        $this->assertEquals("United States", $result);

        $result = mgeo_shortcode_handler([], "", "mgeo_city");
        $this->assertEquals("San Francisco", $result);
    }

    public function test_shortcode_handler_server_mode_unknown()
    {
        update_option('mgeo_client_server_mode', 'server');
        // Set mock data specifically for this test
        $this->set_mock_location_data([
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "Unknown", // Simulate unknown data
            "city" => "San Francisco",
            "ip" => "192.168.1.1",
        ]);
        $this->reset_location_static_cache(); // Reset cache after setting mock data

        $result = mgeo_shortcode_handler([], "", "mgeo_region");
        $this->assertEquals("Unknown", $result);
    }

    public function test_shortcode_handler_server_mode_default_attribute()
    {
        update_option('mgeo_client_server_mode', 'server');
        // Set mock data specifically for this test
        $this->set_mock_location_data([
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "Unknown", // Simulate unknown data
            "city" => "San Francisco",
            "ip" => "192.168.1.1",
        ]);
        $this->reset_location_static_cache(); // Reset cache after setting mock data

        $result = mgeo_shortcode_handler(
            ["default" => "N/A"], // Provide custom default
            "",
            "mgeo_region"
        );
        $this->assertEquals("N/A", $result);
    }

    public function test_shortcode_handler_client_mode()
    {
        update_option('mgeo_client_server_mode', 'client');
        $result = mgeo_shortcode_handler(
            ["default" => "Fallback Country"],
            "",
            "mgeo_country"
        );
        // Expect the client-side placeholder span
        $expected =
            '<span data-mgeo-print="true" data-mgeo-field="country" data-mgeo-default="Fallback Country" style="visibility: hidden;">Fallback Country</span>';
        $this->assertEquals($expected, $result);
    }

    // --- Tests for mgeo_country_flag_shortcode ---

    public function test_flag_shortcode_server_mode_success()
    {
        update_option('mgeo_client_server_mode', 'server');
        $result = mgeo_country_flag_shortcode([]);
        // Use regex to check if src attribute ends with the expected path
        $this->assertMatchesRegularExpression(
            '|src="[^"]*/plugins/maki-geo/src/assets/flags/us\.svg"|',
            $result,
            'The src attribute should end with the correct flag path.'
        );
        $this->assertStringContainsString('alt="United States flag"', $result);
        $this->assertStringContainsString('style="width: 24px; height: auto;"', $result); // Default size
    }

    public function test_flag_shortcode_server_mode_custom_size()
    {
        update_option('mgeo_client_server_mode', 'server');
        $result = mgeo_country_flag_shortcode(["size" => "32"]); // Numeric size
        $this->assertStringContainsString('style="width: 32px; height: auto;"', $result);

        $result = mgeo_country_flag_shortcode(["size" => "2em"]); // Size with unit
        $this->assertStringContainsString('style="width: 2em; height: auto;"', $result);
    }

    public function test_flag_shortcode_server_mode_unknown_country()
    {
        update_option('mgeo_client_server_mode', 'server');
        // Set mock data specifically for this test
        $this->set_mock_location_data([
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "Unknown", // Simulate unknown country
            "region" => "California",
            "city" => "San Francisco",
            "ip" => "192.168.1.1",
        ]);
        $this->reset_location_static_cache(); // Reset cache after setting mock data

        $result = mgeo_country_flag_shortcode([]);
        $this->assertEquals("", $result);
    }

    public function test_flag_shortcode_client_mode()
    {
        update_option('mgeo_client_server_mode', 'client');
        $result = mgeo_country_flag_shortcode(["size" => "30px"]);
        // Expect the client-side placeholder span
        $expected =
            '<span data-mgeo-print="true" data-mgeo-field="flag" data-mgeo-size="30px" style="visibility: hidden;"></span>';
        $this->assertEquals($expected, $result);
    }
}
