<?php
if (!defined('ABSPATH')) {
    exit;
}

function mgeo_render_tabs()
{
    ?>
    <nav class="nav-tab-wrapper">
        <a href="#settings" class="nav-tab nav-tab-active">General</a>
        <a href="#geo-rules" class="nav-tab">Global Geo Rules</a>
    </nav>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const tabs = document.querySelectorAll('.nav-tab');
            const tabContents = document.querySelectorAll('.mgeo-admin-tab');

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
