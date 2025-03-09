<?php
/**
 * Test cases for geo redirection functionality
 *
 * @package Maki_Geo
 */

class TestGeoRedirectionBackend extends WP_UnitTestCase
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

    public function test_should_find_matching_redirection()
    {
        $result = mgeo_find_matching_redirection(
            $this->mockRedirections,
            $this->mockLocationData,
            "https://example.com/test-page/"
        );

        $this->assertNotNull($result);
        $this->assertEquals("https://example.com/en/test-page/", $result);
    }

    public function test_should_ignore_disabled_redirections()
    {
        // Change location to match only the disabled redirection
        $locationData = array_merge($this->mockLocationData, [
            "country" => "Canada",
            "country_code" => "CA",
        ]);

        // Only the disabled US redirection should match, but it should be ignored
        $result = mgeo_find_matching_redirection(
            $this->mockRedirections,
            $locationData,
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

        // Test matching URL
        $result = mgeo_find_matching_redirection(
            $specificRedirections,
            $this->mockLocationData,
            "https://example.com/products/"
        );
        $this->assertEquals("https://us-store.example.com/products/", $result);

        // Test non-matching URL
        $result = mgeo_find_matching_redirection(
            $specificRedirections,
            $this->mockLocationData,
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

        // Test URL that should be excluded by exact match
        $result = mgeo_find_matching_redirection(
            $redirectionsWithExclusions,
            $this->mockLocationData,
            "https://example.com/no-redirect/"
        );
        $this->assertNull($result);

        // Test URL that should be excluded by contains
        $result = mgeo_find_matching_redirection(
            $redirectionsWithExclusions,
            $this->mockLocationData,
            "https://example.com/wp-admin/options.php"
        );
        $this->assertNull($result);

        // Test URL that should be excluded by query parameter
        $result = mgeo_find_matching_redirection(
            $redirectionsWithExclusions,
            $this->mockLocationData,
            "https://example.com/page/?no_redirect=1"
        );
        $this->assertNull($result);

        // Test URL that should not be excluded
        $result = mgeo_find_matching_redirection(
            $redirectionsWithExclusions,
            $this->mockLocationData,
            "https://example.com/products/"
        );
        $this->assertEquals("https://us.example.com/products/", $result);
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

        // Test no path, no query
        $result = mgeo_find_matching_redirection(
            [$redirectionsWithOptions[0]],
            $this->mockLocationData,
            "https://example.com/products/?color=red"
        );
        $this->assertEquals("https://us.example.com/", $result);

        // Test path, no query
        $canadaLocation = array_merge($this->mockLocationData, [
            "country" => "Canada",
            "country_code" => "CA",
        ]);
        $result = mgeo_find_matching_redirection(
            [$redirectionsWithOptions[1]],
            $canadaLocation,
            "https://example.com/products/?color=red"
        );
        $this->assertEquals("https://ca.example.com/products/", $result);

        // Test path and query
        $result = mgeo_find_matching_redirection(
            [$redirectionsWithOptions[2]],
            $this->mockLocationData,
            "https://example.com/products/?color=red"
        );
        $this->assertEquals(
            "https://ca.example.com/products/?color=red",
            $result
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

        // Test AND conditions - should match
        $result = mgeo_find_matching_redirection(
            [$complexRedirections[0]],
            $this->mockLocationData,
            "https://example.com/products/"
        );
        $this->assertEquals(
            "https://california.example.com/products/",
            $result
        );

        // Test AND conditions - should not match
        $texasLocation = array_merge($this->mockLocationData, [
            "region" => "Texas",
        ]);
        $result = mgeo_find_matching_redirection(
            [$complexRedirections[0]],
            $texasLocation,
            "https://example.com/products/"
        );
        $this->assertNull($result);

        // Test OR conditions - should match first condition
        $ukLocation = array_merge($this->mockLocationData, [
            "country" => "United Kingdom",
            "country_code" => "UK",
        ]);
        $result = mgeo_find_matching_redirection(
            [$complexRedirections[1]],
            $ukLocation,
            "https://example.com/products/"
        );
        $this->assertEquals("https://english.example.com/products/", $result);

        // Test OR conditions - should match second condition
        $auLocation = array_merge($this->mockLocationData, [
            "country" => "Australia",
            "country_code" => "AU",
        ]);
        $result = mgeo_find_matching_redirection(
            [$complexRedirections[1]],
            $auLocation,
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

        // Test first location
        $result = mgeo_find_matching_redirection(
            $multiLocationRedirection,
            $this->mockLocationData,
            "https://example.com/products/"
        );
        $this->assertEquals("https://us.example.com/products/", $result);

        // Test second location
        $canadaLocation = array_merge($this->mockLocationData, [
            "country" => "Canada",
            "country_code" => "CA",
        ]);
        $result = mgeo_find_matching_redirection(
            $multiLocationRedirection,
            $canadaLocation,
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

        // Test URL with hash that should be excluded
        $result = mgeo_find_matching_redirection(
            $hashExclusionRedirection,
            $this->mockLocationData,
            "https://example.com/products/#no-redirect"
        );
        $this->assertNull($result);

        // Test URL with hash that should not be excluded
        $result = mgeo_find_matching_redirection(
            $hashExclusionRedirection,
            $this->mockLocationData,
            "https://example.com/products/#section1"
        );
        $this->assertEquals(
            "https://us.example.com/products/#section1",
            $result
        );
    }
}
