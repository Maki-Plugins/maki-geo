<?php
if (!defined('ABSPATH')) {
    exit;
}

function mgeo_can_manage_rules() {
    return current_user_can('manage_options');
}

function mgeo_can_view_location() {
    // Allow all logged-in users to view location data
    return is_user_logged_in();
}
