<?php
if (!defined('ABSPATH')) {
    exit;
}

function mgeo_can_manage_rules() {
    return current_user_can('manage_options');
}

function mgeo_can_view_location() {
    // Allow public access to location data
    return true;
}
