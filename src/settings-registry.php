<?php
if (!defined('ABSPATH')) {
    exit;
}

class mgeo_SettingsRegistry
{
    private static $instance = null;
    private $settings = [];

    public static function get_instance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        // Core plugin options
        $this->register_setting('maki_geo_options');
        $this->register_setting('maki_geo_rules');
        $this->register_setting('maki_geo_rules_options');
        $this->register_setting('mgeo_monthly_requests');
        $this->register_setting('mgeo_request_limit');
    }

    public function register_setting($option_name)
    {
        if (!in_array($option_name, $this->settings)) {
            $this->settings[] = $option_name;
        }
    }

    public function get_all_settings()
    {
        return $this->settings;
    }
}
