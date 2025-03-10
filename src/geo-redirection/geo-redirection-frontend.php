<?php
/**
 * Geo redirection functionality
 *
 * @package Maki_Geo
 */
if (!defined("ABSPATH")) {
    exit();
}

/**
 * Add client-side redirection script if needed
 */
function mgeo_add_client_side_redirection()
{
    // Only run on frontend, not in admin
    if (is_admin()) {
        return;
    }

    // Get client/server mode setting
    $client_server_mode = get_option("mgeo_client_server_mode", "server");

    // Only add script in client mode
    if ($client_server_mode !== "client") {
        return;
    }

    // Check if there are any redirections configured
    $redirections = mgeo_get_redirections();
    if (empty($redirections)) {
        return;
    }

    // Get current URL
    $current_url = mgeo_get_current_url();
    // Check if the current URL has any potential redirections before making an API call
    if (!mgeo_url_has_potential_redirections($redirections, $current_url)) {
        return;
    }

    // Enqueue the client-side redirection script
    mgeo_enqueue(
        "mgeo-client-redirection",
        "build/geo-redirection-frontend.js",
        "script",
        ["wp-api-fetch"]
    );
}
add_action("wp_enqueue_scripts", "mgeo_add_client_side_redirection");
