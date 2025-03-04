<?php

if (!defined("ABSPATH")) {
    exit();
}

require_once plugin_dir_path(__FILE__) . "tabs/settings.php";
require_once plugin_dir_path(__FILE__) . "tabs/tabs-manager.php";

function mgeo_render_settings_page()
{
    ?>
    <div class="wrap">
        <h1><img width="auto" height="24px" src="<?php echo esc_url(
            plugin_dir_url(__FILE__) . "../assets/maki-geo-logo.svg"
        ); ?>" /> 
        <?php echo esc_html(get_admin_page_title()); ?></h1>
        <?php mgeo_render_tabs(); ?>
        <div style="margin-top: 20px">
            <?php mgeo_render_settings_tab(); ?>
        </div>
    </div>
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
    ]);

    // Register settings sections
    add_settings_section(
        "maki_geo_general_section",
        "General",
        null,
        "mgeo_general_options"
    );

    // Register fields
    add_settings_field(
        "client_server_mode",
        "Geo Targeting Method",
        "mgeo_render_client_server_mode_field",
        "mgeo_general_options",
        "maki_geo_general_section"
    );

    add_settings_field(
        "api_key",
        "API Key",
        "mgeo_render_api_key_field",
        "mgeo_general_options",
        "maki_geo_general_section"
    );
}

function mgeo_render_client_server_mode_field()
{
    $method = get_option("mgeo_client_server_mode", "server"); ?>
    <select name="mgeo_client_server_mode">
        <option value="server" <?php selected(
            "server",
            $method
        ); ?>>Server-side (Default)</option>
        <option value="client" <?php selected(
            "client",
            $method
        ); ?>>Client-side</option>
    </select>
    <p class="description">
        Server-side: Processes geo location on the server when the page loads.<br>
        Client-side: Uses AJAX to evaluate geo location in the browser. This works better with caching plugins but is slightly slower and requires javascript.<br>
        <b>Our advise:</b> Use Server-side unless you're experiencing wrong location detection due to caching.
    </p>
    <?php
}

function mgeo_render_api_key_field()
{
    $api_key = get_option("mgeo_api_key", ""); ?>
    <input type="text" 
           name="mgeo_api_key" 
           value="<?php echo esc_attr($api_key); ?>" 
           class="regular-text"
    />
    <button type="button" id="verify-api-key" class="button button-secondary">
        Verify Key
    </button>
    <p class="description">
        Enter your API key to increase your monthly request limit. 
        <a href="<?php echo esc_url(
            MGEO_MAKI_PLUGINS_URL . "#pricing"
        ); ?>" target="_blank">
            Get an API key
        </a>
    </p>
    <?php
}

function mgeo_add_admin_menu()
{
    add_menu_page(
        "Maki Geo",
        "Maki Geo",
        "manage_options",
        "maki-geo",
        "mgeo_render_settings_page",
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
    mgeo_enqueue("maki-geo-admin-style", "src/admin/admin.css", "style");

    mgeo_enqueue(
        "maki-geo-admin-tabs",
        "src/admin/tabs/admin-tabs.js",
        "script",
        ["wp-i18n", "wp-api-fetch"]
    );

    mgeo_enqueue(
        "maki-geo-admin-settings",
        "src/admin/tabs/admin-settings.js",
        "script",
        ["wp-api-fetch", "wp-i18n", "wp-dom-ready"]
    );
}

add_action("admin_menu", "mgeo_add_admin_menu");
add_action("admin_init", "mgeo_register_settings");
add_action("admin_enqueue_scripts", "mgeo_enqueue_admin_scripts");
