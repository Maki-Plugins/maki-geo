<?php
if (!defined('ABSPATH')) {
    exit;
}

class mgeo_MakiPluginsAPI
{
    private $api_key;

    public function __construct($api_key = null)
    {
        $this->api_key = $api_key;
    }

    public function get_location($ip)
    {
        $response = wp_remote_get(
            MGEO_MAKI_PLUGINS_API . "/getLocation?ip=" . urlencode($ip)
        );

        if (is_wp_error($response)) {
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if (!isset($data['data'])) {
            return false;
        }

        return $data['data'];
    }

    public function verify_key()
    {
        if (!$this->api_key) {
            return false;
        }

        $response = wp_remote_post(
            MGEO_MAKI_PLUGINS_API . '/verifyKey',
            array(
                'headers' => array(
                    'X-API-Key' => $this->api_key
                )
            )
        );

        if (is_wp_error($response)) {
            return false;
        }

        $body = wp_remote_retrieve_body($response);
        $decoded_body = json_decode($body, true);
        $data = $decoded_body['data'];

        return $data;
    }
}
