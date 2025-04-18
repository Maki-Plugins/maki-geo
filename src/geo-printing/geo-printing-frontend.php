<?php
/**
 * Handles enqueuing scripts for client-side geo printing shortcodes.
 *
 * @package Maki_Geo
 */

if (!defined("ABSPATH")) {
    exit();
}

/**
 * Enqueue client-side script for geo printing shortcodes if needed.
 */
function mgeo_enqueue_geo_printing_scripts()
{
    // Only run on frontend, not in admin or AJAX requests
    if (is_admin() || wp_doing_ajax()) {
        return;
    }

    // Get client/server mode setting
    $client_server_mode = get_option("mgeo_client_server_mode", "server");

    // Only add script in client mode
    if ($client_server_mode !== "client") {
        return;
    }

    global $post;
    $content = isset($post->post_content) ? $post->post_content : "";

    // Check if any of the geo printing shortcodes are present in the content
    $has_shortcode = false;
    $shortcodes = [
        "mgeo_continent",
        "mgeo_country",
        "mgeo_region",
        "mgeo_city",
        "mgeo_country_flag",
    ];
    foreach ($shortcodes as $shortcode) {
        if (has_shortcode($content, $shortcode)) {
            $has_shortcode = true;
            break;
        }
    }

    if (!$has_shortcode) {
        return;
    }

    // Enqueue the client-side printing script
    wp_enqueue_script("geo-printing-frontend");
}
add_action("wp_enqueue_scripts", "mgeo_enqueue_geo_printing_scripts");

?>
