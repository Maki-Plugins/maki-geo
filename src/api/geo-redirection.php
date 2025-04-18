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
 * Register REST API endpoint for managing redirections
 */
function mgeo_register_redirections_api()
{
    register_rest_route("maki-geo/v1", "/redirections", [
        [
            "methods" => "GET",
            "callback" => "mgeo_get_redirections_api",
            "permission_callback" => "mgeo_can_manage_rules",
        ],
        [
            "methods" => "POST",
            "callback" => "mgeo_save_redirections_api",
            "permission_callback" => "mgeo_can_manage_rules",
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
 * Handle POST requests for redirections API
 *
 * @param WP_REST_Request $request API request object
 * @return WP_REST_Response API response
 */
function mgeo_save_redirections_api($request)
{
    mgeo_verify_nonce();
    $redirections = $request->get_json_params();

    if (empty($redirections) || !is_array($redirections)) {
        return new WP_REST_Response(
            ["success" => false, "message" => "Invalid redirections data"],
            400
        );
    }

    $success = mgeo_save_redirections($redirections);

    if ($success) {
        return new WP_REST_Response(["success" => true]);
    } else {
        return new WP_REST_Response(
            ["success" => false, "message" => "Failed to save redirections"],
            500
        );
    }
}

/**
 * Save redirections to the database
 *
 * @param array $redirections Array of redirection configurations
 * @return bool Whether the save was successful
 */
function mgeo_save_redirections($redirections)
{
    // Ensure we have an array
    if (!is_array($redirections)) {
        return false;
    }

    // Update the option
    // TODO: Check if the user is allowed to update this
    return update_option("mgeo_redirections", $redirections);
}

/**
 * Sanitize redirections data before saving
 *
 * @param mixed $redirections Redirections data to sanitize
 * @return array Sanitized redirections data
 */
function mgeo_sanitize_redirections($redirections)
{
    // If it's a JSON string, decode it
    if (is_string($redirections)) {
        $decoded = json_decode($redirections, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $redirections = $decoded;
        }
    }

    // Ensure we have an array
    if (!is_array($redirections)) {
        return [];
    }

    // Return the sanitized array
    return $redirections;
}
