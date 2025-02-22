<?php
if (!defined("ABSPATH")) {
    exit();
}

function mgeo_render_admin_page()
{
    ?>
    <div id="maki-geo-admin-root"></div>
    <?php
}

function mgeo_register_settings()
{
    $registry = mgeo_SettingsRegistry::get_instance();

    // Register settings with the registry
    $registry->register_setting("mgeo_client_server_mode", [
        "type" => "string",
        "default" => "server",
        "sanitize_callback" => "sanitize_text_field",
        "show_in_rest" => true,
    ]);

    $registry->register_setting("mgeo_api_key", [
        "type" => "string",
        "sanitize_callback" => "sanitize_key",
        "show_in_rest" => true,
    ]);

    $registry->register_setting("mgeo_monthly_requests", [
        "type" => "integer",
        "default" => 0,
        "sanitize_callback" => "sanitize_text_field", // Todo: Create sanitize number
        "show_in_rest" => true,
    ]);

    $registry->register_setting("mgeo_request_limit", [
        "type" => "integer",
        "default" => 1000,
        "sanitize_callback" => "sanitize_text_field", // Todo: Create sanitize number
        "show_in_rest" => true,
    ]);

    $registry->register_setting("mgeo_geo_rules", [
        "sanitize_callback" => "mgeo_sanitize_geo_rules",
        "show_in_rest" => true,
    ]);
}

function mgeo_add_admin_menu()
{
    add_menu_page(
        "Maki Geo",
        "Maki Geo",
        "manage_options",
        "maki-geo",
        "mgeo_render_admin_page",
        "dashicons-admin-site",
        71
    );
}

function mgeo_enqueue_admin_scripts($hook)
{
    if ($hook !== "toplevel_page_maki-geo") {
        return;
    }

    // Styles
    wp_enqueue_style("wp-edit-blocks");
    mgeo_enqueue("maki-geo-admin-style", "build/admin.css", "style");

    // Scripts
    $admin_script_asset = include plugin_dir_path(__FILE__) .
        "../../build/admin.asset.php";
    mgeo_enqueue(
        "maki-geo-admin",
        "build/admin.js",
        "script",
        $admin_script_asset["dependencies"]
    );

    $registry = mgeo_SettingsRegistry::get_instance();
    $settings = $registry->get_all_settings();

    wp_localize_script("maki-geo-admin", "makiGeoData", [
        "nonce" => wp_create_nonce("maki_geo_save_rules"),
        "globalRules" => get_option("mgeo_geo_rules", []),
        "settings" => [
            "clientServerMode" => $settings["mgeo_client_server_mode"],
            "apiKey" => $settings["mgeo_api_key"],
            "monthlyRequests" => intval($settings["mgeo_monthly_requests"]),
            "requestLimit" => intval($settings["mgeo_request_limit"]),
        ],
    ]);
}

add_action("admin_menu", "mgeo_add_admin_menu");
add_action("admin_init", "mgeo_register_settings");
add_action("rest_api_init", "mgeo_register_settings");
add_action("admin_enqueue_scripts", "mgeo_enqueue_admin_scripts");
