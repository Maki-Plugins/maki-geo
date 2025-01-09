<?php

if (!defined('ABSPATH')) {
    exit;
}

function gu_render_settings_page()
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

        .gu-admin-tab {
            display: none;
        }

        .gu-admin-tab.active {
            display: block;
        }

        .gu-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .gu-stat-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            text-align: center;
        }

        .gu-stat-number {
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
            color: #2271b1;
        }

        .gu-stat-text {
            font-size: 18px;
            margin: 10px 0;
            color: #2271b1;
        }

        .geo-rules-save-button {
            margin-top: 20px;
            padding: 10px;
        }
    </style>

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

function gu_register_settings()
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
        'gu_render_debug_mode_field',
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
        'gu_render_default_action_field',
        'maki_geo_rules',
        'maki_geo_rules_section'
    );
}

function gu_render_debug_mode_field()
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

function gu_render_default_action_field()
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

function gu_add_admin_menu()
{
    add_menu_page(
        'Maki Geo Settings',
        'Maki Geo',
        'manage_options',
        'maki-geo-settings',
        'gu_render_settings_page',
        'dashicons-admin-site',
        30
    );
}

function gu_enqueue_admin_scripts($hook)
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

add_action('admin_menu', 'gu_add_admin_menu');
add_action('admin_init', 'gu_register_settings');
add_action('admin_enqueue_scripts', 'gu_enqueue_admin_scripts');
