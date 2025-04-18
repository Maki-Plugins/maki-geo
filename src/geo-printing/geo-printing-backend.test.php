<?php
/**
 * Test cases for geo printing shortcode backend logic.
 *
 * @package Maki_Geo
 */

// Mock WordPress functions needed for testing
// Force mock definition even if function exists
function get_option($option, $default = false)
{
    // Allow overriding via a global variable for tests
    global $mock_options;
    return isset($mock_options[$option]) ? $mock_options[$option] : $default;
}

if (!function_exists("esc_attr")) {
    function esc_attr($text)
    {
        global $mock_options;
        return isset($mock_options[$option])
            ? $mock_options[$option]
            : $default;
        return htmlspecialchars($text, ENT_QUOTES, "UTF-8");
    }
}

if (!function_exists("esc_html")) {
    function esc_html($text)
    {
        return htmlspecialchars($text, ENT_NOQUOTES, "UTF-8");
    }
}

if (!function_exists("esc_url")) {
    function esc_url($url)
    {
        // Simple mock for testing
        return filter_var($url, FILTER_SANITIZE_URL);
    }
}

if (!function_exists("shortcode_atts")) {
    function shortcode_atts($defaults, $atts, $shortcode = "")
    {
        $atts = (array) $atts;
        $out = [];
        foreach ($defaults as $name => $default) {
            if (array_key_exists($name, $atts)) {
                $out[$name] = $atts[$name];
            } else {
                $out[$name] = $default;
            }
        }
        return $out;
    }
}

if (!function_exists("plugin_dir_url")) {
    function plugin_dir_url($file)
    {
        $out = [];
        foreach ($defaults as $name => $default) {
            if (array_key_exists($name, $atts)) {
                $out[$name] = $atts[$name];
            } else {
                $out[$name] = $default;
            }
        }
        // Mock the URL for testing purposes
        return "http://example.com/wp-content/plugins/maki-geo/";
    }
}

// Mock the location data function if it doesn't exist (for isolated testing)
// Force mock definition even if function exists
function mgeo_get_geolocation_data()
{
    global $mock_location_data;
    return $mock_location_data ?? null;
}

class TestGeoPrintingBackend extends WP_UnitTestCase
{
    private $original_options;
    private $original_location_data;

    public function setUp(): void
    {
        parent::setUp();
        global $mock_options, $mock_location_data;

        // Backup globals
        $this->original_options = $mock_options ?? [];
        $this->original_location_data = $mock_location_data ?? [];

        // Set default mocks for tests
        $mock_options = [
            "mgeo_client_server_mode" => "server", // Default to server mode
        ];
        $mock_location_data = [
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "California",
            "city" => "San Francisco",
            "ip" => "192.168.1.1",
        ];
    }

    public function tearDown(): void
    {
        global $mock_options, $mock_location_data;
        // Restore globals
        $mock_options = $this->original_options;
        $mock_location_data = $this->original_location_data;
        parent::tearDown();
    }

    // --- Helper to set mode ---
    private function set_mode($mode)
    {
        global $mock_options;
        $mock_options["mgeo_client_server_mode"] = $mode;
    }

    // --- Tests for mgeo_shortcode_handler ---

    public function test_shortcode_handler_server_mode_success()
    {
        $this->set_mode("server");
        $result = mgeo_shortcode_handler([], "", "mgeo_country");
        $this->assertEquals("United States", $result);

        $result = mgeo_shortcode_handler([], "", "mgeo_city");
        $this->assertEquals("San Francisco", $result);
    }

    public function test_shortcode_handler_server_mode_unknown()
    {
        global $mock_location_data;
        $mock_location_data["region"] = "Unknown";

        $this->set_mode("server");
        $result = mgeo_shortcode_handler([], "", "mgeo_region");
        $this->assertEquals("Unknown", $result); // Default value
    }

    public function test_shortcode_handler_server_mode_default_attribute()
    {
        global $mock_location_data;
        $mock_location_data["region"] = "Unknown";

        $this->set_mode("server");
        $result = mgeo_shortcode_handler(
            ["default" => "N/A"],
            "",
            "mgeo_region"
        );
        $this->assertEquals("N/A", $result);
    }

    public function test_shortcode_handler_client_mode()
    {
        $this->set_mode("client");
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
        $this->set_mode("server");
        $result = mgeo_country_flag_shortcode([]);
        $expected =
            '<img src="http://example.com/wp-content/plugins/maki-geo/src/assets/flags/us.svg" alt="United States flag" class="mgeo-country-flag" style="width: 24px; height: auto;" />';
        $this->assertEquals($expected, $result);
    }

    public function test_flag_shortcode_server_mode_custom_size()
    {
        $this->set_mode("server");
        $result = mgeo_country_flag_shortcode(["size" => "32"]); // Numeric size
        $expected =
            '<img src="http://example.com/wp-content/plugins/maki-geo/src/assets/flags/us.svg" alt="United States flag" class="mgeo-country-flag" style="width: 32px; height: auto;" />';
        $this->assertEquals($expected, $result);

        $result = mgeo_country_flag_shortcode(["size" => "2em"]); // Size with unit
        $expected =
            '<img src="http://example.com/wp-content/plugins/maki-geo/src/assets/flags/us.svg" alt="United States flag" class="mgeo-country-flag" style="width: 2em; height: auto;" />';
        $this->assertEquals($expected, $result);
    }

    public function test_flag_shortcode_server_mode_unknown_country()
    {
        global $mock_location_data;
        $mock_location_data["country_code"] = "Unknown";

        $this->set_mode("server");
        $result = mgeo_country_flag_shortcode([]);
        $this->assertEquals("", $result); // Should return empty string
    }

    public function test_flag_shortcode_client_mode()
    {
        $this->set_mode("client");
        $result = mgeo_country_flag_shortcode(["size" => "30px"]);
        $expected =
            '<span data-mgeo-print="true" data-mgeo-field="flag" data-mgeo-size="30px" style="visibility: hidden;"></span>';
        $this->assertEquals($expected, $result);
    }
}
?>
