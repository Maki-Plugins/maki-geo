<?php
/**
 * API endpoints for geo redirection
 *
 * @package Maki_Geo
 */

if (!defined("ABSPATH")) {
    exit();
}

/**
 * Register REST API endpoint for client-side redirection
 */
function mgeo_register_redirection_api()
{
    register_rest_route("maki-geo/v1", "/redirection", [
        "methods" => "GET",
        "callback" => "mgeo_handle_redirection_api",
        "permission_callback" => "__return_true",
    ]);
}
add_action("rest_api_init", "mgeo_register_redirection_api");

/**
 * Register REST API endpoints for managing redirections (CRUD)
 */
function mgeo_register_redirections_api()
{
    // Get all redirections
    register_rest_route("maki-geo/v1", "/redirections", [
        "methods" => "GET",
        "callback" => "mgeo_get_redirections_api",
        "permission_callback" => "mgeo_can_manage_rules",
    ]);

    // Create a new redirection
    register_rest_route("maki-geo/v1", "/redirections", [
        "methods" => "POST",
        "callback" => "mgeo_create_redirection_api",
        "permission_callback" => "mgeo_can_manage_rules",
    ]);

    // Update a specific redirection
    register_rest_route("maki-geo/v1", "/redirections/(?P<id>[a-zA-Z0-9_]+)", [
        "methods" => "PUT", // Or POST with _method=PUT if PUT is problematic
        "callback" => "mgeo_update_redirection_api",
        "permission_callback" => "mgeo_can_manage_rules",
        "args" => [
            "id" => [
                "validate_callback" => function ($param, $request, $key) {
                    return is_string($param);
                },
            ],
        ],
    ]);

    // Delete a specific redirection
    register_rest_route("maki-geo/v1", "/redirections/(?P<id>[a-zA-Z0-9_]+)", [
        "methods" => "DELETE",
        "callback" => "mgeo_delete_redirection_api",
        "permission_callback" => "mgeo_can_manage_rules",
        "args" => [
            "id" => [
                "validate_callback" => function ($param, $request, $key) {
                    return is_string($param);
                },
            ],
        ],
    ]);
}
add_action("rest_api_init", "mgeo_register_redirections_api");

/**
 * Sanitizes a single redirection object.
 *
 * @param array $redirection The redirection object to sanitize.
 * @return array|null The sanitized redirection object, or null if invalid.
 */
function mgeo_sanitize_single_redirection($redirection)
{
    if (!is_array($redirection)) {
        return null;
    }

    $sanitized = [];
    $allowed_condition_types = ["continent", "country", "region", "city", "ip"];
    $allowed_condition_operators = ["is", "is not"];
    $allowed_location_operators = ["AND", "OR"];
    $allowed_targeting_types = ["all", "specific"];
    $allowed_exclusion_types = [
        "url_equals",
        "url_contains",
        "query_contains",
        "hash_contains",
    ];

    $sanitized["id"] = isset($redirection["id"])
        ? sanitize_key($redirection["id"])
        : uniqid("red_");
    $sanitized["isEnabled"] = isset($redirection["isEnabled"])
        ? (bool) $redirection["isEnabled"]
        : true;
    $sanitized["name"] = isset($redirection["name"])
        ? sanitize_text_field($redirection["name"])
        : "Untitled Redirection";

    $sanitized["locations"] = [];
    if (
        isset($redirection["locations"]) &&
        is_array($redirection["locations"])
    ) {
        foreach ($redirection["locations"] as $location) {
            if (!is_array($location)) {
                continue;
            }

            $sanitized_loc = [];
            $sanitized_loc["id"] = isset($location["id"])
                ? sanitize_key($location["id"])
                : uniqid("loc_");

            $sanitized_loc["conditions"] = [];
            if (
                isset($location["conditions"]) &&
                is_array($location["conditions"])
            ) {
                foreach ($location["conditions"] as $condition) {
                    if (
                        !is_array($condition) ||
                        empty($condition["type"]) ||
                        empty($condition["operator"]) ||
                        !isset($condition["value"])
                    ) {
                        continue;
                    }

                    $sanitized_cond = [];
                    $sanitized_cond["type"] = in_array(
                        $condition["type"],
                        $allowed_condition_types
                    )
                        ? sanitize_key($condition["type"])
                        : "country";
                    $sanitized_cond["operator"] = in_array(
                        $condition["operator"],
                        $allowed_condition_operators
                    )
                        ? sanitize_key($condition["operator"])
                        : "is";
                    $sanitized_cond["value"] = sanitize_text_field(
                        $condition["value"]
                    ); // Basic sanitization for all types

                    if (!empty($sanitized_cond["value"])) {
                        // Don't add conditions with empty values
                        $sanitized_loc["conditions"][] = $sanitized_cond;
                    }
                }
            }
            // A location must have at least one valid condition
            if (empty($sanitized_loc["conditions"])) {
                continue; // Skip this location if it has no valid conditions
            }

            $sanitized_loc["operator"] =
                isset($location["operator"]) &&
                in_array($location["operator"], $allowed_location_operators)
                    ? sanitize_text_field($location["operator"])
                    : "OR";
            $sanitized_loc["pageTargetingType"] =
                isset($location["pageTargetingType"]) &&
                in_array(
                    $location["pageTargetingType"],
                    $allowed_targeting_types
                )
                    ? sanitize_key($location["pageTargetingType"])
                    : "all";
            $sanitized_loc["redirectUrl"] = isset($location["redirectUrl"])
                ? esc_url_raw($location["redirectUrl"])
                : "";

            $sanitized_loc["redirectMappings"] = [];
            if (
                isset($location["redirectMappings"]) &&
                is_array($location["redirectMappings"])
            ) {
                foreach ($location["redirectMappings"] as $mapping) {
                    if (
                        !is_array($mapping) ||
                        empty($mapping["fromUrl"]) ||
                        empty($mapping["toUrl"])
                    ) {
                        continue;
                    }

                    $sanitized_map = [];
                    $sanitized_map["id"] = isset($mapping["id"])
                        ? sanitize_key($mapping["id"])
                        : uniqid("map_");
                    // Allow relative paths for 'fromUrl', but sanitize
                    $sanitized_map["fromUrl"] = sanitize_text_field(
                        $mapping["fromUrl"]
                    );
                    $sanitized_map["toUrl"] = esc_url_raw($mapping["toUrl"]);
                    $sanitized_loc["redirectMappings"][] = $sanitized_map;
                }
            }

            $sanitized_loc["exclusions"] = [];
            if (
                isset($location["exclusions"]) &&
                is_array($location["exclusions"])
            ) {
                foreach ($location["exclusions"] as $exclusion) {
                    if (
                        !is_array($exclusion) ||
                        empty($exclusion["type"]) ||
                        !isset($exclusion["value"])
                    ) {
                        continue;
                    }

                    $sanitized_excl = [];
                    $sanitized_excl["id"] = isset($exclusion["id"])
                        ? sanitize_key($exclusion["id"])
                        : uniqid("excl_");
                    $sanitized_excl["type"] = in_array(
                        $exclusion["type"],
                        $allowed_exclusion_types
                    )
                        ? sanitize_key($exclusion["type"])
                        : "url_equals";
                    $sanitized_excl["value"] = sanitize_text_field(
                        $exclusion["value"]
                    );

                    if (!empty($sanitized_excl["value"])) {
                        // Don't add exclusions with empty values
                        $sanitized_loc["exclusions"][] = $sanitized_excl;
                    }
                }
            }

            $sanitized_loc["passPath"] = isset($location["passPath"])
                ? (bool) $location["passPath"]
                : true;
            $sanitized_loc["passQuery"] = isset($location["passQuery"])
                ? (bool) $location["passQuery"]
                : true;

            // Validate cross-field rules after sanitizing individual fields
            if (
                $sanitized_loc["pageTargetingType"] === "all" &&
                empty($sanitized_loc["redirectUrl"])
            ) {
                continue; // Skip location if 'all' pages but no redirect URL
            }
            if (
                $sanitized_loc["pageTargetingType"] === "specific" &&
                empty($sanitized_loc["redirectMappings"])
            ) {
                continue; // Skip location if 'specific' pages but no mappings
            }

            $sanitized["locations"][] = $sanitized_loc;
        }
    }

    // A redirection must have at least one valid location
    if (empty($sanitized["locations"])) {
        return null; // Indicate this redirection is invalid
    }

    return $sanitized;
}

/**
 * Sanitizes an array of redirection objects.
 *
 * @param array $redirections_input Array of redirection objects.
 * @return array Sanitized array of redirection objects.
 */
function mgeo_sanitize_redirections($redirections_input)
{
    if (!is_array($redirections_input)) {
        return [];
    }

    $sanitized_redirections = [];
    foreach ($redirections_input as $redirection) {
        $sanitized = mgeo_sanitize_single_redirection($redirection);
        if ($sanitized !== null) {
            // Only add valid, sanitized redirections
            $sanitized_redirections[] = $sanitized;
        }
    }

    return $sanitized_redirections;
}

/**
 * Handle client-side redirection API requests
 *
 * @param WP_REST_Request $request API request object
 * @return WP_REST_Response API response
 */
function mgeo_handle_redirection_api($request)
{
    mgeo_verify_nonce();
    $current_url = isset($_SERVER["HTTP_REFERER"])
        ? $_SERVER["HTTP_REFERER"]
        : "";
    if (empty($current_url)) {
        return new WP_REST_Response(["redirect" => false]);
    }

    // Get the potential redirect URL using the core logic function
    $redirect_url = mgeo_get_redirect_url_for_request($current_url);

    if (!empty($redirect_url)) {
        return new WP_REST_Response([
            "redirect" => true,
            "url" => $redirect_url,
        ]);
    }

    return new WP_REST_Response(["redirect" => false]);
}

/**
 * Handle GET requests for redirections API
 *
 * @return WP_REST_Response API response with redirections
 */
function mgeo_get_redirections_api()
{
    mgeo_verify_nonce();
    $redirections = mgeo_get_redirections();
    return new WP_REST_Response($redirections);
}

/**
 * Handle POST requests to create a new redirection.
 *
 * @param WP_REST_Request $request API request object.
 * @return WP_REST_Response API response.
 */
function mgeo_create_redirection_api($request)
{
    mgeo_verify_nonce();
    $raw_data = $request->get_json_params();

    // Sanitize the incoming data first
    $new_redirection_data = mgeo_sanitize_single_redirection($raw_data);

    if ($new_redirection_data === null) {
        // Check if sanitization deemed it invalid
        return new WP_REST_Response(
            [
                "success" => false,
                "message" => "Invalid redirection data provided.",
            ],
            400
        );
    }

    // Assign a unique ID to the redirection itself
    $new_redirection_data["id"] = uniqid("red_");

    $redirections = mgeo_get_redirections(); // Get current (already sanitized) redirections
    $redirections[] = $new_redirection_data; // Add the newly sanitized redirection

    // Save the updated list (already sanitized)
    if (update_option("mgeo_redirections", $redirections)) {
        return new WP_REST_Response(
            ["success" => true, "redirection" => $new_redirection_data], // Return the sanitized data
            201
        ); // Return the created redirection with its ID
    } else {
        return new WP_REST_Response(
            ["success" => false, "message" => "Failed to create redirection."],
            500
        );
    }
}

/**
 * Handle PUT requests to update an existing redirection.
 *
 * @param WP_REST_Request $request API request object.
 * @return WP_REST_Response API response.
 */
function mgeo_update_redirection_api($request)
{
    mgeo_verify_nonce();
    $id = $request->get_param("id");
    $raw_data = $request->get_json_params();

    // Sanitize the incoming data
    $updated_data = mgeo_sanitize_single_redirection($raw_data);

    // Check if sanitization failed or ID mismatch after sanitization
    if (
        $updated_data === null ||
        !isset($updated_data["id"]) || // ID should exist after sanitization
        $updated_data["id"] !== sanitize_key($id) // Compare sanitized IDs
    ) {
        return new WP_REST_Response(
            [
                "success" => false,
                "message" => "Invalid redirection data or ID mismatch.",
            ],
            400
        );
    }

    $redirections = mgeo_get_redirections();
    $found_index = -1;

    foreach ($redirections as $index => $redirection) {
        if (isset($redirection["id"]) && $redirection["id"] === $id) {
            $found_index = $index;
            break;
        }
    }

    if ($found_index === -1) {
        return new WP_REST_Response(
            ["success" => false, "message" => "Redirection not found."],
            404
        );
    }

    // If the update didn't update anything `update_option` would return false,
    // which could make it look like the update failed. Therefore, if we're not
    // updating anything, just return with a positive response.
    if ($redirections[$found_index] == $updated_data) {
        return new WP_REST_Response([
            "success" => true,
            "redirection" => $updated_data,
        ]);
    }

    // Replace the old redirection with the sanitized data
    $redirections[$found_index] = $updated_data;

    // Save the updated list (containing the newly sanitized item)
    if (update_option("mgeo_redirections", $redirections)) {
        return new WP_REST_Response([
            "success" => true,
            "redirection" => $updated_data, // Return the sanitized data
        ]);
    } else {
        return new WP_REST_Response(
            ["success" => false, "message" => "Failed to update redirection."],
            500
        );
    }
}

/**
 * Handle DELETE requests to remove a redirection.
 *
 * @param WP_REST_Request $request API request object.
 * @return WP_REST_Response API response.
 */
function mgeo_delete_redirection_api($request)
{
    mgeo_verify_nonce();
    $id = $request->get_param("id");

    if (empty($id)) {
        return new WP_REST_Response(
            ["success" => false, "message" => "Redirection ID is required."],
            400
        );
    }

    $redirections = mgeo_get_redirections();
    $initial_count = count($redirections);

    // Filter out the redirection with the matching ID
    $updated_redirections = array_filter($redirections, function (
        $redirection
    ) use ($id) {
        return !isset($redirection["id"]) || $redirection["id"] !== $id;
    });

    // Check if any redirection was actually removed
    if (count($updated_redirections) === $initial_count) {
        return new WP_REST_Response(
            ["success" => false, "message" => "Redirection not found."],
            404
        );
    }

    // Save the updated list (re-index array)
    if (
        update_option("mgeo_redirections", array_values($updated_redirections))
    ) {
        return new WP_REST_Response(["success" => true]);
    } else {
        return new WP_REST_Response(
            ["success" => false, "message" => "Failed to delete redirection."],
            500
        );
    }
}

// Note: mgeo_save_redirections and mgeo_sanitize_redirections are no longer needed
// as saving/validation is handled within specific CRUD endpoints.
// They can be removed if not used elsewhere.
