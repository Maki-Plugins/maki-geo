<?php
if (!defined('ABSPATH')) {
    exit;
}

function mgeo_render_settings_tab()
{
    ?>
    <div id="settings" class="mgeo-admin-tab">
        <div class="mgeo-admin-card">
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
    <?php
}
