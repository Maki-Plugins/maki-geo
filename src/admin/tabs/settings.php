<?php
if (!defined("ABSPATH")) {
    exit();
}

function mgeo_render_settings_tab()
{
    $monthly_requests = get_option("mgeo_monthly_requests", 0);
    $api_key = get_option("mgeo_api_key") ?? "";
    $request_limit = $api_key ? get_option("mgeo_request_limit", 1000) : 1000;
    $requests_remaining = max(0, $request_limit - $monthly_requests);
    ?>
    <div id="settings" class="mgeo-admin-tab active">
        <div class="mgeo-admin-container">
            <div class="mgeo-main-content">
                <div class="mgeo-admin-card">
                    <form method="post" action="options.php">
                    <?php
                    settings_fields("mgeo_general_options");
                    do_settings_sections("mgeo_general_options");
                    submit_button();
                    ?>
                    </form>
                </div>
            </div>
            <div class="mgeo-sidebar">
                <div class="mgeo-admin-card">
                    <h2>Usage Statistics</h2>
                    <div class="mgeo-stats-grid">
                        <div class="mgeo-stat-box">
                            <h3>Location API Requests this month</h3>
                            <p class="mgeo-stat-number"><?php echo esc_html(
                                $monthly_requests
                            ); ?></p>
                            <p class="mgeo-stat-subtext">
                                Limit: <?php echo esc_html(
                                    $request_limit
                                ); ?> (<?php echo esc_html(
     $requests_remaining
 ); ?> remaining)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php
}
