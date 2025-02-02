<?php

if (!defined('ABSPATH')) {
    exit;
}

require_once plugin_dir_path(__FILE__) . 'tabs/geo-rules.php';
require_once plugin_dir_path(__FILE__) . 'tabs/settings.php';
require_once plugin_dir_path(__FILE__) . 'tabs/tabs-manager.php';

function mgeo_render_settings_page()
{
    ?>
    <div class="wrap">
        <h1><img width="auto" height="24px" src="<?php echo esc_url(plugin_dir_url(__FILE__) . '../assets/maki-geo-logo.svg') ?>" /> 
        <?php echo esc_html(get_admin_page_title()); ?></h1>
        <?php 
        mgeo_render_tabs();
        ?>
        <div style="margin-top: 20px">
            <?php
            mgeo_render_settings_tab();
            mgeo_render_geo_rules_tab();
            ?>
        </div>
    </div>
    <?php
}

function mgeo_register_settings()
{
    $registry = mgeo_SettingsRegistry::get_instance();
    
    // Register settings with the registry
    $registry->register_setting(
        'mgeo_general_options', [
        'type' => 'object',
        'default' => [
            'client_server_mode' => 'server',
            'api_key' => ''
        ]
        ]
    );
    
    // Register settings sections
    add_settings_section(
        'maki_geo_general_section',
        'General',
        null,
        'mgeo_general_options'
    );

    // Register fields
    add_settings_field(
        'client_server_mode',
        'Geo Targeting Method',
        'mgeo_render_client_server_mode_field',
        'mgeo_general_options',
        'maki_geo_general_section'
    );

    add_settings_field(
        'api_key',
        'API Key',
        'mgeo_render_api_key_field',
        'mgeo_general_options',
        'maki_geo_general_section'
    );

    
    // Register rules settings with the registry
    $registry->register_setting('mgeo_geo_rules');

    // Register settings sections for rules
    add_settings_section(
        'mgeo_geo_rules_section',
        'Default Geo Rules',
        null,
        'mgeo_geo_rules'
    );
}

function mgeo_render_client_server_mode_field()
{
    $options = get_option('mgeo_general_options', array());
    $method = isset($options['client_server_mode']) ? $options['client_server_mode'] : 'server';
    ?>
    <select name="mgeo_general_options[client_server_mode]">
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

function mgeo_render_api_key_field()
{
    $options = get_option('mgeo_general_options', array());
    $api_key = isset($options['api_key']) ? $options['api_key'] : '';
    ?>
    <input type="text" 
           name="mgeo_general_options[api_key]" 
           value="<?php echo esc_attr($api_key); ?>" 
           class="regular-text"
    />
    <button type="button" id="verify-api-key" class="button button-secondary">
        Verify Key
    </button>
    <p class="description">
        Enter your API key to increase your monthly request limit. 
        <a href="<?php echo esc_url(MGEO_MAKI_PLUGINS_URL . '#pricing'); ?>" target="_blank">
            Get an API key
        </a>
    </p>
    <?php
}

function mgeo_add_admin_menu()
{
    add_menu_page(
        'Maki Geo',
        'Maki Geo',
        'manage_options',
        'maki-geo',
        'mgeo_render_settings_page',
        'dashicons-admin-site',
        71
    );
}

function mgeo_enqueue_admin_scripts($hook)
{
    if ($hook !== 'toplevel_page_maki-geo') {
        return;
    }

    wp_enqueue_style('wp-edit-blocks');  // For block editor styles
    
    // Enqueue admin CSS and JS with proper dependencies
    mgeo_enqueue_admin('maki-geo-admin-style', 'src/admin/admin.css', 'style');
    
    // Register admin scripts with dependencies
    $script_asset = include plugin_dir_path(__FILE__) . '../../build/admin.asset.php';
    mgeo_enqueue_admin(
        'maki-geo-admin',
        'build/admin.js',
        'script',
        $script_asset['dependencies'],
        ['async' => true, 'defer' => true]
    );
    
    // Add tab management scripts
    mgeo_enqueue_admin(
        'maki-geo-admin-tabs',
        'src/admin/tabs/admin-tabs.js',
        'script',
        ['wp-i18n', 'wp-api-fetch']
    );
    
    // Add settings page scripts
    mgeo_enqueue_admin(
        'maki-geo-admin-settings',
        'src/admin/tabs/admin-settings.js', 
        'script',
        ['wp-api-fetch', 'wp-i18n', 'wp-dom-ready']
    );
    
    // Pass data to scripts using wp_add_inline_script
    $maki_geo_data = wp_json_encode([
        'nonce' => wp_create_nonce('maki_geo_save_rules'),
        'globalRules' => get_option('mgeo_geo_rules', []),
        'apiUrl' => rest_url('/maki-geo/v1/')
    ]);
    
    wp_add_inline_script(
        'maki-geo-admin',
        'window.makiGeoData = ' . $maki_geo_data . ';',
        'before'
    );
}

add_action('admin_menu', 'mgeo_add_admin_menu');
add_action('admin_init', 'mgeo_register_settings');
add_action('admin_enqueue_scripts', 'mgeo_enqueue_admin_scripts');
