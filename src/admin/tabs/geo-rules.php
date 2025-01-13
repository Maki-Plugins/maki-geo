<?php
if (!defined('ABSPATH')) {
    exit;
}

function mgeo_render_geo_rules_tab()
{
    ?>
    <div id="geo-rules" class="mgeo-admin-tab">
        <div class="mgeo-admin-card">
            <h2>Global Geo Rules</h2>
            <p>Configure global geo-targeting rules that you can reuse site-wide.</p>
            <div id="geo-rules-admin"></div>
        </div>
    </div>
    <?php
}
