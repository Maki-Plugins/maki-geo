<?php
if (! defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

/**
 * Enqueue a script or style
 * 
 * The relpath is from the plugin root dir and shouldn't start with a slash. 
 * I.e. it is appeded to something like "wp-content/plugins/maki-geo/"
 */
function mgeo_enqueue($handle, $relpath, $type='script', $deps=array())
{
    $uri = plugins_url('../' . $relpath, __FILE__);
    $plugin_root_path = plugin_dir_path(__FILE__) . '../';
    $version = filemtime($plugin_root_path . $relpath);
    if($type == 'script') { 
        wp_enqueue_script($handle, $uri, $deps, $version);
    } else if($type == 'style') {
        wp_enqueue_style($handle, $uri, $deps, $version);
    }      
}
