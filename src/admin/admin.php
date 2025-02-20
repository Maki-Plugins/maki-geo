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

    register_setting("mgeo_options", "mgeo_monthly_requests", [
        "type" => "integer",
        "default" => 0,
        "show_in_rest" => true,
    ]);

    register_setting("mgeo_options", "mgeo_request_limit", [
        "type" => "integer",
        "default" => 1000,
        "show_in_rest" => true,
    ]);

    register_setting("mgeo_options", "mgeo_geo_rules", [
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

    wp_enqueue_style("wp-components");
    wp_enqueue_style(
        "maki-geo-admin-style",
        plugins_url("admin.css", __FILE__)
    );

    $asset_file = include plugin_dir_path(__FILE__) .
        "../../build/admin.asset.php";

    wp_enqueue_script(
        "maki-geo-admin",
        plugins_url("../../build/admin.js", __FILE__),
        array_merge($asset_file["dependencies"], ["wp-api-fetch"]),
        $asset_file["version"],
        true
    );

    wp_localize_script("maki-geo-admin", "makiGeoData", [
        "nonce" => wp_create_nonce("wp_rest"),
        "restUrl" => esc_url_raw(rest_url()),
        "globalRules" => get_option("mgeo_geo_rules", []),
    ]);
}

add_action("admin_menu", "mgeo_add_admin_menu");
add_action("admin_init", "mgeo_register_settings");
add_action("admin_enqueue_scripts", "mgeo_enqueue_admin_scripts");
