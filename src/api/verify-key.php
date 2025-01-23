<?php
if (!defined('ABSPATH')) {
    exit;
}

add_action(
    'rest_api_init', function () {
        register_rest_route(
            'maki-geo/v1', '/verify-key', array(
            'methods' => 'POST',
            'callback' => 'mgeo_verify_api_key',
            'permission_callback' => 'mgeo_can_manage_rules',
            )
        );
    }
);

function mgeo_verify_api_key($request)
{
    mgeo_verify_nonce();
    
    $params = $request->get_json_params();
    $api_key = isset($params['api_key']) ? sanitize_text_field($params['api_key']) : '';

    if (empty($api_key)) {
        return new WP_Error('invalid_key', 'API key is required', array('status' => 400));
    }

    $api = new mgeo_MakiPluginsApi($api_key);
    $result = $api->verify_key();

    if (!$result || !isset($result['valid']) || !$result['valid']) {
        return array(
            'success' => false,
            'message' => 'Invalid API key'
        );
    }

    // Save the verified key
    $options = get_option('maki_geo_options', array());
    $options['api_key'] = $api_key;
    update_option('maki_geo_options', $options);

    // Update the request limit
    $request_limiter = new mgeo_RequestLimiter();
    $request_limiter->sync_with_api();

    return array(
        'success' => true,
        'data' => $result
    );
}
