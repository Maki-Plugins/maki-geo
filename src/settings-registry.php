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
    }

    public function register_setting($option_name, $args = [])
    {
        if (!in_array($option_name, $this->settings)) {
            $this->settings[] = $option_name;
            
            // Merge default args with provided args
            $default_args = [
                'type' => 'string',
                'description' => '',
                'sanitize_callback' => null,
                'show_in_rest' => true
            ];
            
            $merged_args = wp_parse_args($args, $default_args);
            
            // Register with WordPress if admin is initialized
            if (did_action('admin_init')) {
                register_setting('maki_geo_options', $option_name, $merged_args);
            }
        }
    }


    public function get_all_settings()
    {
        return $this->settings;
    }
}
