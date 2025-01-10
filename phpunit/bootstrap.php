<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package Maki_Geo
 */

$_tests_dir = getenv('WP_TESTS_DIR');

if (!$_tests_dir) {
    throw new Exception(
        'WP_TESTS_DIR environment 
variable is not set.'
    );
}

// Forward custom PHPUnit Polyfills configuration to PHPUnit bootstrap file.
$_phpunit_polyfills_path = getenv('WP_TESTS_PHPUNIT_POLYFILLS_PATH');
if (false !== $_phpunit_polyfills_path ) {
    define('WP_TESTS_PHPUNIT_POLYFILLS_PATH', $_phpunit_polyfills_path);
}

require 'vendor/yoast/phpunit-polyfills/phpunitpolyfills-autoload.php';


// Load the WordPress test environment
require_once $_tests_dir . '/includes/functions.php';

// Load your plugin
function _manually_load_plugin()
{
    include dirname(__DIR__) . '/maki-geo.php';   
}
tests_add_filter('muplugins_loaded', '_manually_load_plugin');

require $_tests_dir . '/includes/bootstrap.php';
