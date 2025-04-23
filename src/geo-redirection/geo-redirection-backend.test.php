<?php
/**
 * Test cases for geo redirection functionality
 *
 * @package Maki_Geo
 */

class TestGeoRedirectionCoreLogic extends WP_UnitTestCase
{
    use MockLocationHelper;

    private $mockRedirections;

    public function setUp(): void
    {
        parent::setUp();
        $this->start_mocking_location(); // Uses default US/CA data initially
        $this->reset_location_static_cache(); // Ensure clean static cache

        // Sample redirection configuration - remains the same
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
        $this->stop_mocking_location();
        // Clean up option used in tests
        delete_option("mgeo_redirections");
        parent::tearDown();
    }

    // No longer need the filter_location_data method

    public function test_should_find_matching_redirection()
    {
        // Mock get_option to return our test redirections
        update_option("mgeo_redirections", $this->mockRedirections);

        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/test-page/"
        );

        $this->assertNotNull($result);
        $this->assertEquals("https://example.com/en/test-page/", $result);
    }

    public function test_should_ignore_disabled_redirections()
    {
        // Set mock location data for Canada
        $this->set_mock_location_data([
            "continent" => "North America",
            "country" => "Canada",
            "country_code" => "CA",
            "region" => "Ontario",
            "city" => "Toronto",
            "ip" => "192.168.1.2",
        ]);

        // Mock get_option to return our test redirections
        update_option("mgeo_redirections", $this->mockRedirections);

        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/test-page/"
        );

        $this->assertNull($result);
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
    }

    public function test_should_handle_path_and_query_options()
    {
        // Create redirections with different path/query options
        // Order matters for specificity (Region before Country).
        $redirectionsWithOptions = [
            [
                // Rule for California: passPath=true, passQuery=true
                "id" => "red_130",
                "name" => "California (Path=T, Query=T)",
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
                        "redirectUrl" => "https://cali.example.com/", // Target URL for California
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => true,
                        "passQuery" => true,
                    ],
                ],
            ],
            [
                // Rule for Texas: passPath=false, passQuery=false
                "id" => "red_130b",
                "name" => "Texas (Path=F, Query=F)",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_461b",
                        "conditions" => [
                            [
                                "type" => "region",
                                "value" => "Texas",
                                "operator" => "is",
                            ],
                            [
                                // Ensure it's US Texas
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                        ],
                        "operator" => "AND", // Match US AND Texas
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://tx.example.com/", // Target URL for Texas
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => false,
                        "passQuery" => false,
                    ],
                ],
            ],
            [
                // Rule for US (excluding California and Texas): passPath=false, passQuery=true
                "id" => "red_128",
                "name" => "US excl CA/TX (Path=F, Query=T)",
                "isEnabled" => true,
                "locations" => [
                    [
                        "id" => "loc_461",
                        "conditions" => [
                            [
                                // Is US
                                "type" => "country",
                                "value" => "US",
                                "operator" => "is",
                            ],
                            [
                                // Is NOT California
                                "type" => "region",
                                "value" => "California",
                                "operator" => "is not",
                            ],
                            [
                                // Is NOT Texas
                                "type" => "region",
                                "value" => "Texas",
                                "operator" => "is not",
                            ],
                        ],
                        "operator" => "AND", // Must satisfy all conditions
                        "pageTargetingType" => "all",
                        "redirectUrl" => "https://us.example.com/", // Target URL for general US
                        "redirectMappings" => [],
                        "exclusions" => [],
                        "passPath" => false, // Test this combo
                        "passQuery" => true, // Test this combo
                    ],
                ],
            ],
            [
                // Rule for Canada: passPath=true, passQuery=false
                "id" => "red_129",
                "name" => "Canada (Path=T, Query=F)",
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
            // red_130 (California rule) moved above red_128 (US rule)
        ];

        // Mock get_option to return our test redirections
        update_option("mgeo_redirections", $redirectionsWithOptions);

        // --- Test Case 1: California (Matches red_130: Path=T, Query=T) ---
        // Location is already US/California from setUp
        $request_url =
            "https://example.com/products/?color=red&size=large#details";
        $result = mgeo_get_redirect_url_for_request($request_url);
        $this->assertEquals(
            "https://cali.example.com/products/?color=red&size=large#details", // Expect path, query, and hash
            $result,
            "Failed: California rule (Path=T, Query=T)"
        );

        // --- Test Case 2: Canada (Matches red_129: Path=T, Query=F) ---
        $this->set_mock_location_data([
            "continent" => "North America",
            "country" => "Canada",
            "country_code" => "CA",
            "region" => "Ontario", // Change region to avoid matching red_130
            "city" => "Toronto",
            "ip" => "192.168.1.2",
        ]);
        $result = mgeo_get_redirect_url_for_request($request_url);
        $this->assertEquals(
            "https://ca.example.com/products/#details", // Expect path and hash, but NO query
            $result,
            "Failed: Canada rule (Path=T, Query=F)"
        );

        // --- Test Case 3: US - New York (Matches red_128: Path=F, Query=T) ---
        $this->set_mock_location_data([
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "New York", // Not California or Texas
            "city" => "New York City",
            "ip" => "192.168.1.3",
        ]);
        $result = mgeo_get_redirect_url_for_request($request_url);
        $this->assertEquals(
            "https://us.example.com/?color=red&size=large#details", // Expect query and hash, but NO path
            $result,
            "Failed: General US rule (Path=F, Query=T)"
        );

        // --- Test Case 4: US - Texas (Matches red_130b: Path=F, Query=F) ---
        $this->set_mock_location_data([
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "Texas",
            "city" => "Austin",
            "ip" => "192.168.1.4",
        ]);
        $result = mgeo_get_redirect_url_for_request($request_url);
        $this->assertEquals(
            "https://tx.example.com/#details", // Expect hash ONLY
            $result,
            "Failed: Texas rule (Path=F, Query=F)"
        );

        // --- Test Case 5: Reset to California (Matches red_130 again) ---
        // This ensures the mock data changes didn't break the initial state logic
        $this->set_mock_location_data([
            // Set back to default
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "California",
            "city" => "San Francisco",
            "ip" => "192.168.1.1",
        ]);
        $result = mgeo_get_redirect_url_for_request($request_url);
        $this->assertEquals(
            "https://cali.example.com/products/?color=red&size=large#details",
            $result,
            "Failed: California rule after reset (Path=T, Query=T)"
        );
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
        // Set mock location data for US/California (default)
        $this->set_mock_location_data([
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "California",
            "city" => "San Francisco",
            "ip" => "192.168.1.1",
        ]);
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals(
            "https://california.example.com/products/",
            $result
        );

        // Test AND conditions - should not match (red_131)
        // Set mock location data for US/Texas
        $this->set_mock_location_data([
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "Texas",
            "city" => "Austin",
            "ip" => "192.168.1.3",
        ]);
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertNull($result); // No other rule matches Texas

        // Test OR conditions - should match first condition (red_132)
        // Set mock location data for UK
        $this->set_mock_location_data([
            "continent" => "Europe",
            "country" => "United Kingdom",
            "country_code" => "UK",
            "region" => "England",
            "city" => "London",
            "ip" => "192.168.1.4",
        ]);
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals("https://english.example.com/products/", $result);

        // Test OR conditions - should match second condition (red_132)
        // Set mock location data for AU
        $this->set_mock_location_data([
            "continent" => "Oceania",
            "country" => "Australia",
            "country_code" => "AU",
            "region" => "New South Wales",
            "city" => "Sydney",
            "ip" => "192.168.1.5",
        ]);
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals("https://english.example.com/products/", $result);
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
        // Set mock location data for US (default)
        $this->set_mock_location_data([
            "continent" => "North America",
            "country" => "United States",
            "country_code" => "US",
            "region" => "California",
            "city" => "San Francisco",
            "ip" => "192.168.1.1",
        ]);
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals("https://us.example.com/products/", $result);

        // Test second location (CA)
        // Set mock location data for Canada
        $this->set_mock_location_data([
            "continent" => "North America",
            "country" => "Canada",
            "country_code" => "CA",
            "region" => "Ontario",
            "city" => "Toronto",
            "ip" => "192.168.1.2",
        ]);
        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/products/"
        );
        $this->assertEquals("https://ca.example.com/products/", $result);
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

        // Remove any filters that could be conflicting
        remove_filter(
            "pre_mgeo_url_has_potential_redirections",
            "__return_true"
        );
        remove_filter(
            "pre_mgeo_url_has_potential_redirections",
            "__return_false"
        );

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
    }

    public function test_should_return_null_if_location_data_fetch_fails()
    {
        update_option("mgeo_redirections", $this->mockRedirections);
        // Simulate location data fetch failure using the helper
        $this->set_mock_location_data(null);

        $result = mgeo_get_redirect_url_for_request(
            "https://example.com/test-page/"
        );
        $this->assertNull($result);
    }

    // Note: The WP_Error case is implicitly handled by the pre_ filter returning null,
    // as mgeo_get_geolocation_data won't proceed to the point of returning an error.
    // If specific error handling *after* the pre_ filter needs testing, a different approach would be needed.
}
