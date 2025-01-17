<?php
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// List of all options created by the plugin
$maki_geo_options = [
    'maki_geo_options',           // General settings
    'maki_geo_rules_options',     // Geo rules settings
    'maki_geo_rules',            // Global rules
    'mgeo_monthly_requests',     // API request counter
    'mgeo_request_limit',        // API request limit
    'mgeo_last_reset'           // Last reset timestamp
];

// Remove all options
foreach ($maki_geo_options as $option) {
    delete_option($option);
}
