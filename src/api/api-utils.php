<?php
if (!defined('ABSPATH')) {
    exit;
}


function mgeo_can_manage_rules()
{
    return current_user_can('manage_options');
}


function mgeo_verify_nonce()
{
    if (!isset($_SERVER['HTTP_X_WP_NONCE'])) {
        return new WP_Error('rest_forbidden', 'Invalid nonce.', array('status' => 403));
    }

    $nonce = sanitize_text_field(wp_unslash($_SERVER['HTTP_X_WP_NONCE']));
    // Verify the nonce
    if (!wp_verify_nonce($nonce, 'wp_rest')) {
        return new WP_Error('rest_forbidden', 'Invalid nonce.', array('status' => 403));
    }
}
