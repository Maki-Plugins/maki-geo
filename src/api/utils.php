<?php


function verify_nonce()
{
    // Verify the nonce
    if (!isset($_SERVER['HTTP_X_WP_NONCE']) || !wp_verify_nonce($_SERVER['HTTP_X_WP_NONCE'], 'wp_rest')) {
        return new WP_Error('rest_forbidden', 'Invalid nonce.', array('status' => 403));
    }
}
