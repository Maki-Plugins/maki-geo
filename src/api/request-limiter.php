<?php

class mgeo_RequestLimiter
{
    private $monthly_requests_option = 'mgeo_monthly_requests';
    private $last_reset_option = 'mgeo_last_reset';
    private $request_limit_option = 'mgeo_request_limit';

    public function increment_counter()
    {
        $this->check_monthly_reset();
        $current_count = get_option($this->monthly_requests_option, 0);
        update_option($this->monthly_requests_option, $current_count + 1);
    }

    public function can_make_request()
    {
        $this->check_monthly_reset();
        $current_count = get_option($this->monthly_requests_option, 0);
        $limit = $this->get_request_limit();
        return $current_count < $limit;
    }

    private function check_monthly_reset()
    {
        $last_reset = get_option($this->last_reset_option, 0);
        $current_month = date('Y-m');
        $last_reset_month = date('Y-m', $last_reset);

        if ($current_month !== $last_reset_month) {
            update_option($this->monthly_requests_option, 0);
            update_option($this->last_reset_option, time());
        }
    }

    public function get_request_limit()
    {
        $options = get_option('maki_geo_options', array());
        $api_key = isset($options['api_key']) ? $options['api_key'] : '';
        
        if (!$api_key) {
            return 1000; // Free tier limit
        }

        return get_option($this->request_limit_option, 1000);
    }

    public function sync_with_api()
    {
        $options = get_option('maki_geo_options', array());
        $api_key = isset($options['api_key']) ? $options['api_key'] : '';
        
        if (!$api_key) {
            return false;
        }

        $response = wp_remote_get(
            'https://api.makiplugins.com/maki-geo/api/v1/verify-key', 
            array(
                'headers' => array(
                    'X-API-Key' => $api_key
                )
            )
        );

        if (is_wp_error($response)) {
            return false;
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
        
        if (isset($data['valid']) && $data['valid']) {
            update_option($this->request_limit_option, $data['monthly_limit']);
            
            // Sync the request count from the API
            if (isset($data['requests_this_month'])) {
                $local_requests = get_option($this->monthly_requests_option, 0);
                // Use the higher count between local and API to avoid undercounting
                $synced_requests = max($local_requests, $data['requests_this_month']);
                update_option($this->monthly_requests_option, $synced_requests);
            }
            
            return true;
        }

        return false;
    }
}
