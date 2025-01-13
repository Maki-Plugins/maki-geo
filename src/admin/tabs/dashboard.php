<?php
if (!defined('ABSPATH')) {
    exit;
}

function mgeo_render_dashboard_tab() {
    ?>
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
    <?php
}
