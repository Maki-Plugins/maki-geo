<?php
if (!defined("ABSPATH")) {
    exit();
}

class mgeo_CitiesCacheManager {
    private static $instance = null;
    private $cities_data = [];
    
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->load_cities_data();
    }
    
    private function load_cities_data() {
        $cities_file = plugin_dir_path(__FILE__) . '../../src/assets/cities500_updated.txt';
        
        if (!file_exists($cities_file)) {
            if (defined('MGEO_DEBUG')) {
                error_log('Cities file not found: ' . $cities_file);
            }
            return;
        }
        
        $file_contents = file_get_contents($cities_file);
        $lines = explode("\n", $file_contents);
        
        foreach ($lines as $line) {
            $parts = explode("\t", trim($line));
            if (!empty($parts[0])) {
                $this->cities_data[] = $parts[0];
            }
        }
    }
    
    public function search_cities($search_term, $similarity_threshold = 60, $limit = 5) {
        $matches = [];
        $search_term = strtolower($search_term);
        
        foreach ($this->cities_data as $city) {
            $similarity = $this->calculate_similarity($search_term, strtolower($city));
            
            if ($similarity >= $similarity_threshold) {
                $matches[] = [
                    'name' => $city,
                    'similarity' => $similarity
                ];
            }
        }
        
        usort($matches, function($a, $b) {
            return $b['similarity'] <=> $a['similarity'];
        });
        
        return array_slice(
            array_map(function($match) { return $match['name']; }, $matches),
            0,
            $limit
        );
    }
    
    private function calculate_similarity($str1, $str2) {
        similar_text($str1, $str2, $percent);
        return $percent;
    }
}
