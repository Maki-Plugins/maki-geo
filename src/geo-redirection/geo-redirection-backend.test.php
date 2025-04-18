<?php
/**
 * Test cases for geo redirection functionality
 *
 * @package Maki_Geo
 */

class TestGeoRedirectionCoreLogic extends WP_UnitTestCase
{
    private $mockLocationData;
    private $mockRedirections;

    public function setUp(): void
    {
        parent::setUp();
        $this->mockLocationData = [
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "California",
            "city" => "San Francisco",
            "ip" => "192.168.1.1",
        ];

        // Add filter to mock location data retrieval
        add_filter("mgeo_location_data_result", [
            $this,
            "filter_location_data",
        ]);

        // Sample redirection configuration
        $this->mockRedirections = [
            [
                "id" => "red_123",
                "name" => "US to English Site",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_456",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://example.com/en/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
            [
                "id" => "red_124",
                "name" => "Europe to EU Site",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_457",
                        "conditions" => [
                            [
                                "type" => "continent",
                                "value" => "Europe",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://example.com/eu/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
            [
                "id" => "red_125",
                "name" => "Disabled Redirection",
                "isEnabled" => false,
                "locations" => [
                    [
                        "id" => "loc_458",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "CA",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://example.com/disabled/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];
    }

    public function tearDown(): void
    {
        // Remove the filter
        remove_filter("mgeo_location_data_result", [
            $this,
            "filter_location_data",
        ]);
        parent::tearDown();
    }

    /**
     * Filter callback to return mock location data.
     */
    public function filter_location_data($data)
    {
        // Return the mock data set for the current test.
        return $this->mockLocationData;
    }

    public function test_should_find_matching_redirection()
    {
        // Mock get_option to return our test redirections
        update_option("mgeo_redirections", $this->mockRedirections);

        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/test-page/"
        );

        $this->assertNotNull($result);
        $this->assertEquals("https://example.com/en/test-page/", $result);

        // Clean up option
        delete_option("mgeo_redirections");
    }

    public function test_should_ignore_disabled_redirections()
    {
        // Change location to match only the disabled redirection
        $locationData = array_merge($this->mockLocationData, [
            "country" => "Canada",
            "country_code" => "CA",
        ]);
        $this->mockLocationData = $locationData; // Update mock data for the filter

        // Mock get_option to return our test redirections
        update_option("mgeo_redirections", $this->mockRedirections);

        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/test-page/"
        );

        $this->assertNull($result);

        // Clean up option
        delete_option("mgeo_redirections");
    }

    public function test_should_handle_specific_page_targeting()
    {
        // Create a redirection with specific page targeting
        $specificRedirections = [
            [
                "id" => "red_126",
                "name" => "Specific Pages",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_459",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "specific",
                        "redirectUrl" => "",
                        "redirectMappings" => [
                            [
                                "id" => "map_123",
                                "fromUrl" => "/products/",
                                "toUrl" =>
                                    "https://us-store.example.com/products/",
                            ],
                            [
                                "id" => "map_124",
                                "fromUrl" => "/about/",
                                "toUrl" => "https://us.example.com/about-us/",
                            ],
                        ],
                        "exclusions" => [],
                        "passPath" => false,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];

        // Mock get_option to return our test redirections
        update_option("mgeo_redirections", $specificRedirections);

        // Test matching URL
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals("https://us-store.example.com/products/", $result);

        // Test non-matching URL
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/contact/"
        );
        $this->assertNull($result);

        // Clean up option
        delete_option("mgeo_redirections");
    }

    public function test_should_respect_exclusions()
    {
        // Create a redirection with exclusions
        $redirectionsWithExclusions = [
            [
                "id" => "red_127",
                "name" => "With Exclusions",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_460",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://us.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [
                            [
                                "id" => "excl_123",
                                "type" => "url_equals",
                                "value" => "/no-redirect/",
                            ],
                            [
                                "id" => "excl_124",
                                "type" => "url_contains",
                                "value" => "admin",
                            ],
                            [
                                "id" => "excl_125",
                                "type" => "query_contains",
                                "value" => "no_redirect=1",
                            ],
                        ],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];

        // Mock get_option to return our test redirections
        update_option("mgeo_redirections", $redirectionsWithExclusions);

        // Test URL that should be excluded by exact match
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/no-redirect/"
        );
        $this->assertNull($result);

        // Test URL that should be excluded by contains
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/wp-admin/options.php"
        );
        $this->assertNull($result);

        // Test URL that should be excluded by query parameter
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/page/?no_redirect=1"
        );
        $this->assertNull($result);

        // Test URL that should not be excluded
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals("https://us.example.com/products/", $result);

        // Clean up option
        delete_option("mgeo_redirections");
    }

    public function test_should_handle_path_and_query_options()
    {
        // Create redirections with different path/query options
        $redirectionsWithOptions = [
            [
                "id" => "red_128",
                "name" => "No Path No Query",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_461",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://us.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => false,
                        "passQuery" => false,
                    ],
                ],
            ],
            [
                "id" => "red_129",
                "name" => "Path No Query",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_462",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "CA",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://ca.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => false,
                    ],
                ],
            ],
            [
                "id" => "red_130",
                "name" => "Path And Query",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_463",
                        "conditions" => [
                            [
                                "type" => "region",
                                "value" => "California",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://ca.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];

        // Mock get_option to return our test redirections
        update_option("mgeo_redirections", $redirectionsWithOptions);

        // Test no path, no query (Matches red_128)
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/?color=red"
        );
        $this->assertEquals("https://us.example.com/", $result);

        // Test path, no query (Matches red_129)
        $canadaLocation = array_merge($this->mockLocationData, [
            "country" => "Canada",
            "country_code" => "CA",
            "region" => "Ontario", // Change region to avoid matching red_130
        ]);
        $this->mockLocationData = $canadaLocation; // Update mock data for the filter
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/?color=red"
        );
        $this->assertEquals("https://ca.example.com/products/", $result);

        // Test path and query (Matches red_130)
        $californiaLocation = array_merge($this->mockLocationData, [
            "country" => "United States",
            "country_code" => "US",
            "region" => "California",
        ]);
        $this->mockLocationData = $californiaLocation; // Update mock data for the filter
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/?color=red"
        );
        $this->assertEquals(
            "https://ca.example.com/products/?color=red",
            $result
        );

        // Clean up option
        delete_option("mgeo_redirections");
    }

    public function test_should_handle_complex_conditions()
    {
        // Create a redirection with complex conditions
        $complexRedirections = [
            [
                "id" => "red_131",
                "name" => "Complex AND Conditions",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_464",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                            [
                                "type" => "region",
                                "value" => "California",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "AND",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://california.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
            [
                "id" => "red_132",
                "name" => "Complex OR Conditions",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_465",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "UK",
                                "operator" => "is",
                            ],
                            [
                                "type" => "country",
                                "value" => "AU",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://english.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];

        // Mock get_option to return our test redirections
        update_option("mgeo_redirections", $complexRedirections);

        // Test AND conditions - should match (red_131)
        $californiaLocation = array_merge($this->mockLocationData, [
            "country" => "United States",
            "country_code" => "US",
            "region" => "California",
        ]);
        $this->mockLocationData = $californiaLocation;
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals(
            "https://california.example.com/products/",
            $result
        );

        // Test AND conditions - should not match (red_131)
        $texasLocation = array_merge($this->mockLocationData, [
            "region" => "Texas",
        ]);
        $this->mockLocationData = $texasLocation;
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertNull($result); // No other rule matches Texas

        // Test OR conditions - should match first condition (red_132)
        $ukLocation = array_merge($this->mockLocationData, [
            "country" => "United Kingdom",
            "country_code" => "UK",
            "continent" => "Europe",
            "region" => "England",
        ]);
        $this->mockLocationData = $ukLocation;
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals("https://english.example.com/products/", $result);

        // Test OR conditions - should match second condition (red_132)
        $auLocation = array_merge($this->mockLocationData, [
            "country" => "Australia",
            "country_code" => "AU",
            "continent" => "Oceania",
            "region" => "New South Wales",
        ]);
        $this->mockLocationData = $auLocation;
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals("https://english.example.com/products/", $result);

        // Clean up option
        delete_option("mgeo_redirections");
    }

    public function test_should_handle_multiple_locations_in_redirection()
    {
        // Create a redirection with multiple locations
        $multiLocationRedirection = [
            [
                "id" => "red_133",
                "name" => "Multi-Location",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_466",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://us.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                    [
                        "id" => "loc_467",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "CA",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://ca.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];

        // Mock get_option to return our test redirections
        update_option("mgeo_redirections", $multiLocationRedirection);

        // Test first location (US)
        $usLocation = array_merge($this->mockLocationData, [
            "country" => "United States",
            "country_code" => "US",
        ]);
        $this->mockLocationData = $usLocation;
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals("https://us.example.com/products/", $result);

        // Test second location (CA)
        $canadaLocation = array_merge($this->mockLocationData, [
            "country" => "Canada",
            "country_code" => "CA",
        ]);
        $this->mockLocationData = $canadaLocation;
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals("https://ca.example.com/products/", $result);

        // Clean up option
        delete_option("mgeo_redirections");
    }

    public function test_should_handle_hash_contains_exclusion()
    {
        // Create a redirection with hash exclusion
        $hashExclusionRedirection = [
            [
                "id" => "red_134",
                "name" => "Hash Exclusion",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_468",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://us.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [
                            [
                                "id" => "excl_126",
                                "type" => "hash_contains",
                                "value" => "no-redirect",
                            ],
                        ],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];

        // Mock get_option to return our test redirections
        update_option("mgeo_redirections", $hashExclusionRedirection);

        // Test URL with hash that should be excluded
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/#no-redirect"
        );
        $this->assertNull($result);

        // Test URL with hash that should not be excluded
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/#section1"
        );
        $this->assertEquals(
            "https://us.example.com/products/#section1",
            $result
        );

        // Clean up option
        delete_option("mgeo_redirections");
    }

    public function test_should_check_url_has_potential_redirections()
    {
        // This test verifies that we don't waste API calls when there are redirections
        // but none that match the current page

        // Create redirections that only target specific pages
        $specificPageRedirections = [
            [
                "id" => "red_135",
                "name" => "Specific Pages Only",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_469",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "specific",
                        "redirectUrl" => "",
                        "redirectMappings" => [
                            [
                                "id" => "map_125",
                                "fromUrl" => "https://example.com/products/",
                                "toUrl" => "https://us.example.com/products/",
                            ],
                            [
                                "id" => "map_126",
                                "fromUrl" => "https://example.com/about/",
                                "toUrl" => "https://us.example.com/about-us/",
                            ],
                        ],
                        "exclusions" => [],
                        "passPath" => false,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];

        // It should return false for a URL that doesn't match any of the specific pages
        $result = mgeo_url_has_potential_redirections(
            $specificPageRedirections,
            "https://example.com/contact/"
        );
        $this->assertFalse($result);

        // It should return true for a URL that matches one of the specific pages
        $result = mgeo_url_has_potential_redirections(
            $specificPageRedirections,
            "https://example.com/products/"
        );
        $this->assertTrue($result);

        // Test with "all pages" redirection type
        $allPagesRedirections = [
            [
                "id" => "red_136",
                "name" => "All Pages",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_470",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://us.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];

        // Any URL should have potential redirections with "all pages" type
        $result = mgeo_url_has_potential_redirections(
            $allPagesRedirections,
            "https://example.com/any-page/"
        );
        $this->assertTrue($result);

        // Test with disabled redirections
        $disabledRedirections = [
            [
                "id" => "red_137",
                "name" => "Disabled Redirection",
                "isEnabled" => false,
                "locations" => [
                    [
                        "id" => "loc_471",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://us.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];

        // Disabled redirections should not count as potential redirections
        $result = mgeo_url_has_potential_redirections(
            $disabledRedirections,
            "https://example.com/any-page/"
        );
        $this->assertFalse($result);

        // Test with URL exclusions
        $exclusionRedirections = [
            [
                "id" => "red_138",
                "name" => "With Exclusions",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_472",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://us.example.com/",
                        "redirectMappings" => [],
                        "exclusions" => [
                            [
                                "id" => "excl_127",
                                "type" => "url_equals",
                                "value" => "/excluded-page/",
                            ],
                        ],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];

        // Excluded URLs should not have potential redirections
        $result = mgeo_url_has_potential_redirections(
            $exclusionRedirections,
            "https://example.com/excluded-page/"
        );
        $this->assertFalse($result);

        // Non-excluded URLs should have potential redirections
        $result = mgeo_url_has_potential_redirections(
            $exclusionRedirections,
            "https://example.com/normal-page/"
        );
        $this->assertTrue($result);
    }

    public function test_should_return_null_if_no_redirections()
    {
        update_option("mgeo_redirections", []); // No redirections
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/any-page/"
        );
        $this->assertNull($result);
        delete_option("mgeo_redirections");
    }

    public function test_should_return_null_if_no_potential_redirections_for_url()
    {
        // Use specific page redirections from another test
        $specificPageRedirections = [
            [
                "id" => "red_135",
                "name" => "Specific Pages Only",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_469",
                        "conditions" => [
                            [
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "OR",
                        "pageTargetingType" => "specific",
                        "redirectUrl" => "",
                        "redirectMappings" => [
                            [
                                "id" => "map_125",
                                "fromUrl" => "https://example.com/products/",
                                "toUrl" => "https://us.example.com/products/",
                            ],
                        ],
                        "exclusions" => [],
                        "passPath" => false,
                        "passQuery" => true,
                    ],
                ],
            ],
        ];
        update_option("mgeo_redirections", $specificPageRedirections);

        // This URL doesn't match any specific mapping
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/contact/"
        );
        $this->assertNull($result);
        delete_option("mgeo_redirections");
    }

    public function test_should_return_null_if_location_data_fetch_fails()
    {
        update_option("mgeo_redirections", $this->mockRedirections);
        // Make the location data filter return null
        remove_filter("mgeo_location_data_result", [
            $this,
            "filter_location_data",
        ]);
        add_filter("mgeo_location_data_result", function () {
            return null;
        });

        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/test-page/"
        );
        $this->assertNull($result);

        // Restore filter
        remove_filter("mgeo_location_data_result", function () {
            return null;
        });
        add_filter("mgeo_location_data_result", [
            $this,
            "filter_location_data",
        ]);
        delete_option("mgeo_redirections");
    }

    public function test_should_return_null_if_location_data_fetch_returns_error()
    {
        update_option("mgeo_redirections", $this->mockRedirections);
        // Make the location data filter return WP_Error
        remove_filter("mgeo_location_data_result", [
            $this,
            "filter_location_data",
        ]);
        add_filter("mgeo_location_data_result", function () {
            return new WP_Error("test_error", "Test error");
        });

        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/test-page/"
        );
        $this->assertNull($result);

        // Restore filter
        remove_filter("mgeo_location_data_result", function () {
            return new WP_Error("test_error", "Test error");
        });
        add_filter("mgeo_location_data_result", [
            $this,
            "filter_location_data",
        ]);
        delete_option("mgeo_redirections");
    }
}
