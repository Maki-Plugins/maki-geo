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
                    <p>Configure global geo-targeting rules that apply site-wide.</p>
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
                                Delete All Geo Rules
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
        'debug_mode',
        'Debug Mode',
        'mgeo_render_debug_mode_field',
        'maki_geo_settings',
        'maki_geo_general_section'
    );

    add_settings_field(
        'geo_targeting_method',
        'Geo Targeting Method',
        'mgeo_render_geo_targeting_method_field',
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

    add_settings_field(
        'default_action',
        'Default Action',
        'mgeo_render_default_action_field',
        'maki_geo_rules',
        'maki_geo_rules_section'
    );
}

function mgeo_render_geo_targeting_method_field()
{
    $options = get_option('maki_geo_options', array());
    $method = isset($options['geo_targeting_method']) ? $options['geo_targeting_method'] : 'server';
    ?>
    <select name="maki_geo_options[geo_targeting_method]">
        <option value="server" <?php selected('server', $method); ?>>Server-side (Default)</option>
        <option value="client" <?php selected('client', $method); ?>>Client-side (AJAX)</option>
    </select>
    <p class="description">
        Server-side: Processes geo-targeting rules when the page loads.<br>
        Client-side: Uses AJAX to evaluate rules in the browser. Better with caching but requires JavaScript.
    </p>
    <?php
}

function mgeo_render_debug_mode_field()
{
    $options = get_option('maki_geo_options');
    $debug_mode = isset($options['debug_mode']) ? $options['debug_mode'] : 0;
    ?>
    <label>
        <input type="checkbox" name="maki_geo_options[debug_mode]" value="1" <?php checked(1, $debug_mode); ?> />
        Enable debug logging
    </label>
    <p class="description">When enabled, additional debugging information will be logged.</p>
    <?php
}

function mgeo_render_default_action_field()
{
    $options = get_option('maki_geo_rules_options');
    $default_action = isset($options['default_action']) ? $options['default_action'] : 'show';
    ?>
    <select name="maki_geo_rules_options[default_action]">
        <option value="show" <?php selected('show', $default_action); ?>>Show Content</option>
        <option value="hide" <?php selected('hide', $default_action); ?>>Hide Content</option>
    </select>
    <p class="description">Default action when no geo rules match.</p>
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
        'maki-geo-admin', 'makiGeoSettings', [
        'nonce' => wp_create_nonce('maki_geo_save_rules'),
        'globalRules' => get_option('maki_geo_rules', [])
        ]
    );
}

add_action('admin_menu', 'mgeo_add_admin_menu');
add_action('admin_init', 'mgeo_register_settings');
add_action('admin_enqueue_scripts', 'mgeo_enqueue_admin_scripts');
