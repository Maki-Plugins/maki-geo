<?php

if (!defined('ABSPATH')) {
    exit;
}

function mgeo_render_settings_page()
{
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

        <nav class="nav-tab-wrapper">
            <a href="#dashboard" class="nav-tab nav-tab-active">Dashboard</a>
            <a href="#geo-rules" class="nav-tab">Global Geo Rules</a>
            <a href="#settings" class="nav-tab">Settings</a>
        </nav>

        <div class="gu-admin-container">
            <div id="dashboard" class="gu-admin-tab active">
                <div class="gu-admin-card">
                    <h2>Statistics Overview</h2>
                    <div class="gu-stats-grid">
                        <div class="gu-stat-box">
                            <h3>Total Blocks</h3>
                            <p class="gu-stat-number">0</p>
                        </div>
                        <div class="gu-stat-box">
                            <h3>Active Rules</h3>
                            <p class="gu-stat-number">0</p>
                        </div>
                        <div class="gu-stat-box">
                            <h3>Top Country</h3>
                            <p class="gu-stat-text">-</p>
                        </div>
                    </div>
                </div>
            </div>

            <div id="geo-rules" class="gu-admin-tab">
                <div class="gu-admin-card">
                    <h2>Global Geo Rules</h2>
                    <p>Configure global geo-targeting rules that you can reuse site-wide.</p>
                    <div id="geo-rules-admin"></div>
                </div>
            </div>

            <div id="settings" class="gu-admin-tab">
                <div class="gu-admin-card">
                    <form method="post" action="options.php">
                        <?php
                        settings_fields('maki_geo_settings');
                        do_settings_sections('maki_geo_settings');
                        submit_button();
                        ?>
                        <hr />
                        <h3>Danger Zone</h3>
                        <p>
                            <button type="button" id="delete-all-rules" class="button button-link-delete">
                                Delete All Global Geo Rules
                            </button>
                        </p>
                        <script>
                            document.getElementById('delete-all-rules').addEventListener('click', async function() {
                                if (!confirm('Are you sure you want to delete all geo rules? This action cannot be undone.')) {
                                    return;
                                }

                                try {
                                    const response = await wp.apiFetch({
                                        path: 'maki-geo/v1/rules',
                                        method: 'DELETE',
                                    });

                                    if (response.success) {
                                        alert('All rules have been deleted successfully.');
                                        window.location.reload();
                                    }
                                } catch (error) {
                                    console.error('Failed to delete rules:', error);
                                    alert('Failed to delete rules. Please try again.');
                                }
                            });
                        </script>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const tabs = document.querySelectorAll('.nav-tab');
            const tabContents = document.querySelectorAll('.gu-admin-tab');

            function switchTab(e) {
                e.preventDefault();

                // Remove active class from all tabs
                tabs.forEach(tab => tab.classList.remove('nav-tab-active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked tab
                e.target.classList.add('nav-tab-active');

                // Show corresponding content
                const targetId = e.target.getAttribute('href').substring(1);
                document.getElementById(targetId).classList.add('active');
            }

            tabs.forEach(tab => tab.addEventListener('click', switchTab));
        });
    </script>
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
