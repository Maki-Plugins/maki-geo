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

    public function check_monthly_reset($current_time = null)
    {
        $last_reset = get_option($this->last_reset_option, 0);
        $current_month = gmdate('Y-m', $current_time ?? time());
        $last_reset_month = gmdate('Y-m', $last_reset);

        if ($current_month !== $last_reset_month) {
            update_option($this->monthly_requests_option, 0);
            update_option($this->last_reset_option, $current_time ?? time());
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

        $api = new mgeo_MakiPluginsAPI($api_key);
        $data = $api->verify_key();
        
        if (!$data || !isset($data['valid']) || !$data['valid']) {
            return false;
        }

        update_option($this->request_limit_option, $data['monthly_limit']);
        
        // Sync the request count from the API
        if (isset($data['requests_this_month'])) {
            $synced_requests = $data['requests_this_month'];
            update_option($this->monthly_requests_option, $synced_requests);
        }
        
        return true;
    }
}
