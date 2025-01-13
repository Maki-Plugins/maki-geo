<?php
if (!defined('ABSPATH')) {
    exit;
}

function mgeo_render_dashboard_tab()
{
    ?>
    <div id="dashboard" class="mgeo-admin-tab active">
        <div class="mgeo-admin-card">
            <h2>Statistics Overview</h2>
            <div class="mgeo-stats-grid">
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
