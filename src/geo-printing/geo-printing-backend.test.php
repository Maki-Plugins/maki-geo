<?php
/**
 * Test cases for geo printing shortcode backend logic.
 *
 * @package Maki_Geo
 */

// We don't need to mock WP functions anymore, wp-env provides them.
// We will control behavior using options and filters.

class TestGeoPrintingBackend extends WP_UnitTestCase
{
    private $mock_location_data;

    public function setUp(): void
    {
        parent::setUp();

        // Set default location data for tests
        $this->mock_location_data = [
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "California",
            "city" => "San Francisco",
            "ip" => "192.168.1.1",
        ];

        // Add filter to provide mock location data
        add_filter('mgeo_location_data_result', [$this, 'filter_location_data']);

        // Set default mode to server-side for most tests
        update_option('mgeo_client_server_mode', 'server');
    }

    public function tearDown(): void
    {
        // Remove the filter
        remove_filter('mgeo_location_data_result', [$this, 'filter_location_data']);
        // Clean up options
        delete_option('mgeo_client_server_mode');
        parent::tearDown();
    }

    /**
     * Filter callback to return mock location data.
     */
    public function filter_location_data($data)
    {
        // The filter hook allows us to bypass the internal static cache
        // and return the desired mock data directly for the test.
        // No need to reset the static variable via reflection.
        return $this->mock_location_data;
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
        $this->mock_location_data["region"] = "Unknown";

        $result = mgeo_shortcode_handler([], "", "mgeo_region");
        $this->assertEquals("Unknown", $result); // Default value from shortcode_atts
    }

    public function test_shortcode_handler_server_mode_default_attribute()
    {
        update_option('mgeo_client_server_mode', 'server');
        $this->mock_location_data["region"] = "Unknown";

        $result = mgeo_shortcode_handler(
            ["default" => "N/A"],
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
        $expected =
            '<span data-mgeo-print="true" data-mgeo-field="country" data-mgeo-default="Fallback Country" style="visibility: hidden;">Fallback Country</span>';
        $this->assertEquals($expected, $result);
    }

    // --- Tests for mgeo_country_flag_shortcode ---

    public function test_flag_shortcode_server_mode_success()
    {
        update_option('mgeo_client_server_mode', 'server');
        $result = mgeo_country_flag_shortcode([]);
        // Note: The URL might differ slightly based on wp-env setup, check if needed
        $this->assertStringContainsString(
            'src="/wp-content/plugins/maki-geo/src/assets/flags/us.svg"',
            $result
        );
        $this->assertStringContainsString('alt="United States flag"', $result);
        $this->assertStringContainsString('style="width: 24px; height: auto;"', $result);
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
        $this->mock_location_data["country_code"] = "Unknown";

        $result = mgeo_country_flag_shortcode([]);
        $this->assertEquals("", $result); // Should return empty string
    }

    public function test_flag_shortcode_client_mode()
    {
        update_option('mgeo_client_server_mode', 'client');
        $result = mgeo_country_flag_shortcode(["size" => "30px"]);
        $expected =
            '<span data-mgeo-print="true" data-mgeo-field="flag" data-mgeo-size="30px" style="visibility: hidden;"></span>';
        $this->assertEquals($expected, $result);
    }
}
?>
