<?php
/**
 * Helper trait for mocking geolocation data in tests.
 */

trait MockLocationHelper
{
    /**
     * Holds the mock location data for the current test.
     * @var array|null
     */
    private $current_mock_location_data = null;

    /**
     * Default mock location data used if not overridden by set_mock_location_data.
     * @var array
     */
    private $default_mock_location_data = [
        "continent" => "North America",
        "country" => "United States",
        "country_code" => "US",
        "region" => "California",
        "city" => "San Francisco",
        "ip" => "192.168.1.1",
    ];

    /**
     * Adds the filter to mock geolocation data. Call this in setUp().
     */
    public function start_mocking_location()
    {
        // Use a high priority to ensure it runs before other potential filters
        add_filter('pre_mgeo_get_geolocation_data', [$this, 'filter_pre_mgeo_get_geolocation_data'], 1, 1);
        // Set initial mock data for the test run
        $this->current_mock_location_data = $this->default_mock_location_data;
    }

    /**
     * Removes the filter. Call this in tearDown().
     */
    public function stop_mocking_location()
    {
        remove_filter('pre_mgeo_get_geolocation_data', [$this, 'filter_pre_mgeo_get_geolocation_data'], 1);
        $this->current_mock_location_data = null; // Clear data
    }

    /**
     * Sets the location data to be returned by the mock filter.
     *
     * @param array|null $data The mock location data array, or null to simulate failure.
     */
    public function set_mock_location_data(?array $data)
    {
        $this->current_mock_location_data = $data;
    }

    /**
     * Resets the internal static cache in mgeo_get_location_data().
     * Call this in setUp() or tearDown() to ensure test isolation.
     */
    public function reset_location_static_cache()
    {
        // Call the function with force_refresh = true
        mgeo_get_location_data(true);
    }


    /**
     * The filter callback function. Returns the currently set mock data.
     *
     * @param mixed $value The value being filtered (should be null initially).
     * @return array|null The mock location data or null.
     */
    public function filter_pre_mgeo_get_geolocation_data($value)
    {
        // Return the mock data currently set for this test instance
        return $this->current_mock_location_data;
    }
}
