<?php
if (!defined("ABSPATH")) {
    exit(); // Exit if accessed directly.
}

// =========================
// Activate, deactivate, install, uninstall
// =========================
function mgeo_activate()
{
    // Register uninstall when activated
    register_uninstall_hook(__FILE__, "mgeo_uninstall");
}
register_activation_hook(__FILE__, "mgeo_activate");

function mgeo_uninstall()
{
    // Delete all plugin options
    $settings_registry = mgeo_SettingsRegistry::get_instance();
    $settings = $settings_registry->get_all_settings();
    foreach ($settings as $option_name) {
        delete_option($option_name);
    }
}

function mgeo_register_geo_target_assets()
{
    // Registering for use when geo targeted content is embedded on the frontend
    wp_register_script(
        "geo-target-frontend",
        plugins_url("../build/geo-content-frontend.js", __FILE__),
        ["wp-api-fetch"],
        "1.0.0",
        "1.0.0",
        true
    );
    wp_register_script(
        "geo-printing-frontend",
        plugins_url("../build/geo-printing-frontend.js", __FILE__),
        ["wp-api-fetch"],
        "1.0.0",
        true
    );

    // Localize data for both scripts
    $localized_data = [
        "endpoint" => rest_url("maki-geo/v1/location"),
        "nonce" => wp_create_nonce("wp_rest"),
        "pluginUrl" => plugin_dir_url(dirname(__FILE__)), // Pass plugin URL for flag paths
    ];
    wp_localize_script("geo-target-frontend", "makiGeoData", $localized_data);
    wp_localize_script("geo-printing-frontend", "makiGeoPrintingData", $localized_data);
}
add_action("init", "mgeo_register_geo_target_assets");

// Register Gutenberg blocks
function mgeo_create_geo_content_blocks()
{
    register_block_type(__DIR__ . "/../build/blocks/geo-content");
    register_block_type(__DIR__ . "/../build/blocks/geo-popup");

    add_action("enqueue_block_assets", function () {
        // Inline script data
        $script = sprintf(
            "window.makiGeoData = %s;",
            wp_json_encode([
                "nonce" => wp_create_nonce("wp_rest"),
            ])
        );

        // Add the inline script before the block's main script
        wp_add_inline_script(
            "maki-geo-geo-content-editor-script",
            $script,
            "before"
        );
        wp_add_inline_script(
            "maki-geo-geo-popup-editor-script",
            $script,
            "before"
        );
    });
}
add_action("init", "mgeo_create_geo_content_blocks");

require_once "admin/admin.php";
require_once "api/ip-detection/ip-detection.php";
require_once "api/maki-plugins-api/maki-plugins-api.php";
require_once "api/request-limiter/request-limiter.php";
require_once "api/api-utils.php";
require_once "api/cities-cache-manager.php";
require_once "api/city-search.php";
require_once "api/geo-redirection.php";
require_once "api/location.php";
require_once "api/verify-key.php";
require_once "blocks/setup.php";
require_once "geo-conditions/evaluate-conditions-backend.php";
require_once "geo-printing/geo-printing-frontend.php"; // Add this line
require_once "geo-redirection/geo-redirection-backend.php";
require_once "geo-redirection/geo-redirection-frontend.php";
require_once "shortcodes/geo-content-shortcode.php";
require_once "shortcodes/print-geo-shortcodes.php";
require_once "settings-registry.php";
require_once "wp-utils.php";
