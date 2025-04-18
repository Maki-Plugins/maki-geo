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
    $new_redirection_data = $request->get_json_params();

    // TODO: Add robust validation/sanitization for the incoming data structure
    if (empty($new_redirection_data) || !is_array($new_redirection_data)) {
        return new WP_REST_Response(
            ["success" => false, "message" => "Invalid redirection data provided."],
            400
        );
    }

    // Assign a unique ID
    $new_redirection_data["id"] = uniqid("red_");

    $redirections = mgeo_get_redirections(); // Get current redirections
    $redirections[] = $new_redirection_data; // Add the new one

    // Save the updated list
    if (update_option("mgeo_redirections", $redirections)) {
        return new WP_REST_Response(
            ["success" => true, "redirection" => $new_redirection_data],
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
    $updated_data = $request->get_json_params();

    // TODO: Add robust validation/sanitization for the incoming data structure
    if (empty($updated_data) || !is_array($updated_data) || !isset($updated_data["id"]) || $updated_data["id"] !== $id) {
        return new WP_REST_Response(
            ["success" => false, "message" => "Invalid redirection data or ID mismatch."],
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

    // Replace the old redirection with the updated data
    $redirections[$found_index] = $updated_data;

    // Save the updated list
    if (update_option("mgeo_redirections", $redirections)) {
        return new WP_REST_Response(["success" => true, "redirection" => $updated_data]);
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
    $updated_redirections = array_filter(
        $redirections, function ($redirection) use ($id) {
            return !isset($redirection["id"]) || $redirection["id"] !== $id;
        }
    );

    // Check if any redirection was actually removed
    if (count($updated_redirections) === $initial_count) {
        return new WP_REST_Response(
            ["success" => false, "message" => "Redirection not found."],
            404
        );
    }

    // Save the updated list (re-index array)
    if (update_option("mgeo_redirections", array_values($updated_redirections))) {
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
