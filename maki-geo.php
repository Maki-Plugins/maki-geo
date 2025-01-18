<?php

/**
 * Plugin Name:       Maki Geo – Geo targeting
 * Description:       Easily personalize your website based on visitor location. Increase engagement, conversions and revenue using geo targeting. 
 * Version:           1.0.0
 * Requires at least: 6.7
 * Requires PHP:      7.3
 * Author:            Maki Plugins
 * Author URI:        https://makiplugins.com
 * License:           GPLv2
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       maki-geo
 *
 * @package maki-geo
 */

if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}


// =========================
// Global Constants
// =========================
$plugin_data = get_file_data(__FILE__, array('name' => 'Plugin Name', 'version' => 'Version', 'text' => 'Text Domain'));
function mgeo_create_mgeo_constant($constant_name, $value)
{
    $constant_name_prefix = 'MGEO_';
    $constant_name = $constant_name_prefix . $constant_name;
    if (!defined($constant_name)) {
        define($constant_name, $value);
    }
}
mgeo_create_mgeo_constant('URL', plugin_dir_url(__FILE__)); // http://maki-test.local/wp-content/plugins/maki-geo/
mgeo_create_mgeo_constant('PATH', plugin_dir_path(__FILE__)); // E:\webserver\www\testsite\wp-content\plugins\maki-geo/
mgeo_create_mgeo_constant('SLUG', dirname(plugin_basename(__FILE__))); // maki-geo
mgeo_create_mgeo_constant('NAME', $plugin_data['name']); // Maki Geo – Geo targeting
mgeo_create_mgeo_constant('VERSION', $plugin_data['version']); // 1.0.0
mgeo_create_mgeo_constant('TEXT', $plugin_data['text']); // maki-geo
mgeo_create_mgeo_constant('PREFIX', 'mgeo');
mgeo_create_mgeo_constant('MAKI_PLUGINS_URL', 'https://makiplugins.com');
mgeo_create_mgeo_constant('MAKI_PLUGINS_API', 'https://api.makiplugins.com/maki-geo/api/v1');


require_once 'vendor/autoload.php';

require_once "src/index.php";
