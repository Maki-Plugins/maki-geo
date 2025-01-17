<?php
if (!defined('ABSPATH')) {
    exit;
}

function mgeo_render_dashboard_tab()
{
    $monthly_requests = get_option('mgeo_monthly_requests', 0);
    $api_key = get_option('maki_geo_options')['api_key'] ?? '';
    $request_limit = $api_key ? get_option('mgeo_request_limit', 1000) : 1000;
    $requests_remaining = max(0, $request_limit - $monthly_requests);
    
    ?>
    <div id="dashboard" class="mgeo-admin-tab active">
        <div class="mgeo-admin-card">
            <h2>Statistics Overview</h2>
            <div class="mgeo-stats-grid">
                <div class="mgeo-stat-box">
                    <h3>Location API Requests this month</h3>
                    <p class="mgeo-stat-number"><?php echo esc_html($monthly_requests); ?></p>
                    <p class="mgeo-stat-subtext">
                        Limit: <?php echo esc_html($request_limit); ?> (<?php echo esc_html($requests_remaining); ?> remaining)
                    </p>
                </div>
                <div class="mgeo-stat-box">
                    <h3>Total Blocks</h3>
                    <p class="mgeo-stat-number">0</p>
                </div>
                <div class="mgeo-stat-box">
                    <h3>Active Rules</h3>
                    <p class="mgeo-stat-number">0</p>
                </div>
                <div class="mgeo-stat-box">
                    <h3>Top Country</h3>
                    <p class="mgeo-stat-text">-</p>
                </div>
            </div>
        </div>
    </div>
    <?php
}
