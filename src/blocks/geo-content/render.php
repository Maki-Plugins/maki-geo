<?php
if (!defined('ABSPATH')) {
    exit;
}
wp_enqueue_script('geo-target-frontend');
echo wp_kses_post($content);
