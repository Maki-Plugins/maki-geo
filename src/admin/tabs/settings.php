<?php
if (!defined('ABSPATH')) {
    exit;
}

function mgeo_render_settings_tab()
{
    $monthly_requests = get_option('mgeo_monthly_requests', 0);
    $api_key = get_option('mgeo_general_options')['api_key'] ?? '';
    $request_limit = $api_key ? get_option('mgeo_request_limit', 1000) : 1000;
    $requests_remaining = max(0, $request_limit - $monthly_requests);
    
    ?>
    <div id="settings" class="mgeo-admin-tab active">
        <div class="mgeo-admin-container">
        <div class="mgeo-main-content">
            <div class="mgeo-admin-card">
                <form method="post" action="options.php">
                <?php
                settings_fields('mgeo_general_options');
                do_settings_sections('mgeo_general_options');
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
                    document.getElementById('verify-api-key').addEventListener('click', async function() {
                        const apiKeyInput = document.querySelector('input[name="mgeo_general_options[api_key]"]');
                        const apiKey = apiKeyInput.value.trim();
                        
                        if (!apiKey) {
                            alert('Please enter an API key first.');
                            return;
                        }

                        try {
                            const response = await wp.apiFetch({
                                path: 'maki-geo/v1/verify-key',
                                method: 'POST',
                                data: { api_key: apiKey }
                            });

                            if (response.success) {
                                alert('API key verified successfully! Monthly limit: ' + response.data.monthly_limit);
                            } else {
                                alert('Invalid API key. Please check and try again.');
                            }
                        } catch (error) {
                            console.error('Failed to verify key:', error);
                            alert('Failed to verify API key. Please try again.');
                        }
                    });

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
        <div class="mgeo-sidebar">
            <div class="mgeo-admin-card">
                <h2>Usage Statistics</h2>
                <div class="mgeo-stats-grid">
                    <div class="mgeo-stat-box">
                        <h3>Location API Requests this month</h3>
                        <p class="mgeo-stat-number"><?php echo esc_html($monthly_requests); ?></p>
                        <p class="mgeo-stat-subtext">
                            Limit: <?php echo esc_html($request_limit); ?> (<?php echo esc_html($requests_remaining); ?> remaining)
                        </p>
                    </div>
                </div>
            </div>
        </div>
                </div>
    </div>
    <?php
}
