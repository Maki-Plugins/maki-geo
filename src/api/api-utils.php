<?php
if (!defined('ABSPATH')) {
    exit;
}


function verify_nonce()
{
    if (!isset($_SERVER['HTTP_X_WP_NONCE'])) {
        return new WP_Error('rest_forbidden', 'Invalid nonce.', array('status' => 403));
    }

    $nonce = wp_unslash($_SERVER['HTTP_X_WP_NONCE']);
    // Verify the nonce
    if (!wp_verify_nonce($nonce, 'wp_rest')) {
        return new WP_Error('rest_forbidden', 'Invalid nonce.', array('status' => 403));
    }
}
