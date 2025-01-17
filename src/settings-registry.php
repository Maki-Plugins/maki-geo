<?php
if (!defined('ABSPATH')) {
    exit;
}

class mgeo_SettingsRegistry {
    private static $instance = null;
    private $settings = [];
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_init', [$this, 'register_wordpress_settings']);
    }

    public function register_setting($option_name, $args = []) {
        if (!in_array($option_name, $this->settings)) {
            $this->settings[] = $option_name;
            
            // Register with WordPress if admin is initialized
            if (did_action('admin_init')) {
                register_setting($option_name, $option_name, $args);
            }
        }
    }

    public function register_wordpress_settings() {
        // General Settings
        $this->register_setting('maki_geo_options');
        
        // Rules Settings
        $this->register_setting('maki_geo_rules');
        $this->register_setting('maki_geo_rules_options');
        
        // API Limits
        $this->register_setting('mgeo_monthly_requests');
        $this->register_setting('mgeo_request_limit');
    }

    public function get_all_settings() {
        return $this->settings;
    }
}
