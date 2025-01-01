<?php

if (!defined('ABSPATH')) {
    exit;
}

function gu_render_settings_page() {
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        
        <div class="gu-admin-container">
            <div class="gu-admin-card">
                <h2>Statistics</h2>
                <p>Coming soon: Usage statistics and analytics for your geo-targeted content.</p>
            </div>

            <div class="gu-admin-card">
                <h2>Settings</h2>
                <form method="post" action="options.php">
                    <?php
                    settings_fields('geoutils_settings');
                    do_settings_sections('geoutils_settings');
                    submit_button();
                    ?>
                </form>
            </div>
        </div>
    </div>

    <style>
        .gu-admin-container {
            margin-top: 20px;
        }
        .gu-admin-card {
            background: white;
            border: 1px solid #ccd0d4;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .gu-admin-card h2 {
            margin-top: 0;
        }
    </style>
    <?php
}

function gu_register_settings() {
    register_setting('geoutils_settings', 'geoutils_options');

    add_settings_section(
        'geoutils_general_section',
        'General Settings',
        null,
        'geoutils_settings'
    );

    // Add more settings fields here as needed
}

function gu_add_admin_menu() {
    add_menu_page(
        'GeoUtils Settings',
        'GeoUtils',
        'manage_options',
        'geoutils-settings',
        'gu_render_settings_page',
        'dashicons-admin-site',
        30
    );
}

add_action('admin_menu', 'gu_add_admin_menu');
add_action('admin_init', 'gu_register_settings');
