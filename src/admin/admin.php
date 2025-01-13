<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once plugin_dir_path(__FILE__) . 'tabs/dashboard.php';
require_once plugin_dir_path(__FILE__) . 'tabs/geo-rules.php';
require_once plugin_dir_path(__FILE__) . 'tabs/settings.php';
require_once plugin_dir_path(__FILE__) . 'tabs/tabs-manager.php';

function mgeo_render_settings_page()
{
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        <?php 
        mgeo_render_tabs();
        ?>
        <div class="mgeo-admin-container">
            <?php
            mgeo_render_dashboard_tab();
            mgeo_render_geo_rules_tab();
            mgeo_render_settings_tab();
            ?>
        </div>
    </div>
    <?php
}

function mgeo_register_settings()
{
    // General Settings
    register_setting('maki_geo_settings', 'maki_geo_options');

    add_settings_section(
        'maki_geo_general_section',
        'General Settings',
        null,
        'maki_geo_settings'
    );

    add_settings_field(
        'client_server_mode',
        'Geo Targeting Method',
        'mgeo_render_client_server_mode_field',
        'maki_geo_settings',
        'maki_geo_general_section'
    );

    // Geo Rules Settings
    register_setting('maki_geo_rules', 'maki_geo_rules_options');

    add_settings_section(
        'maki_geo_rules_section',
        'Default Geo Rules',
        null,
        'maki_geo_rules'
    );
}

function mgeo_render_client_server_mode_field()
{
    $options = get_option('maki_geo_options', array());
    $method = isset($options['client_server_mode']) ? $options['client_server_mode'] : 'server';
    ?>
    <select name="maki_geo_options[client_server_mode]">
        <option value="server" <?php selected('server', $method); ?>>Server-side (Default)</option>
        <option value="client" <?php selected('client', $method); ?>>Client-side</option>
    </select>
    <p class="description">
        Server-side: Processes geo location on the server when the page loads.<br>
        Client-side: Uses AJAX to evaluate geo location in the browser. This works better with caching plugins but is slightly slower and requires javascript.<br>
        <b>Our advise:</b> Use Server-side unless you're experiencing wrong location detection due to caching.
    </p>
    <?php
}

function mgeo_add_admin_menu()
{
    add_menu_page(
        'Maki Geo Settings',
        'Maki Geo',
        'manage_options',
        'maki-geo-settings',
        'mgeo_render_settings_page',
        'dashicons-admin-site',
        30
    );
}

function mgeo_enqueue_admin_scripts($hook)
{
    if ($hook !== 'toplevel_page_maki-geo-settings') {
        return;
    }

    wp_enqueue_style('wp-edit-blocks');  // For block editor styles
    
    mgeo_enqueue('maki-geo-admin-style', 'src/admin/admin.css', 'style');

    $script_args = include plugin_dir_path(__FILE__) . '../../build/admin.asset.php';
    mgeo_enqueue('maki-geo-admin', 'build/admin.js', 'script', $script_args['dependencies']);

    // Admin script data
    wp_localize_script(
        'maki-geo-admin', 'makiGeoData', [
        'nonce' => wp_create_nonce('maki_geo_save_rules'),
        'globalRules' => get_option('maki_geo_rules', [])
        ]
    );
}

add_action('admin_menu', 'mgeo_add_admin_menu');
add_action('admin_init', 'mgeo_register_settings');
add_action('admin_enqueue_scripts', 'mgeo_enqueue_admin_scripts');
