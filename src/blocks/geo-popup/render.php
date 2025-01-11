<?php
if (!defined('ABSPATH')) {
    exit;
}

echo wp_kses_post($content);

