<?php
if (!defined("ABSPATH")) {
    exit();
}

class mgeo_CitiesCacheManager
{
    private static $instance = null;
    private $indexed_cities = [];
    
    public static function get_instance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct()
    {
        $this->load_cities_data();
    }
    
    private function load_cities_data()
    {
        $cities_file = plugin_dir_path(__FILE__) . '../../src/assets/cities500_updated.json';
        
        if (!file_exists($cities_file)) {
            if (defined('MGEO_DEBUG')) {
                error_log('Cities file not found: ' . $cities_file);
            }
            return;
        }
        
        $json_contents = file_get_contents($cities_file);
        $this->indexed_cities = json_decode($json_contents, true);
    }
    
    public function search_cities($search_term, $limit = 5)
    {
        $search_term = strtolower(trim($search_term));
        if (empty($search_term)) {
            return [];
        }

        $results = [];
        $prefix = substr($search_term, 0, 3);
        
        if (isset($this->indexed_cities[$prefix])) {
            foreach ($this->indexed_cities[$prefix] as $city) {
                $cityName = strtolower($city);
                // Prioritize exact matches first
                if (str_starts_with($cityName, $search_term)) {
                    $results[] = $city;
                }
            }
            
            // If we need more results, look for partial matches
            if (count($results) < $limit) {
                foreach ($this->indexed_cities[$prefix] as $city) {
                    $cityName = strtolower($city);
                    if (!str_starts_with($cityName, $search_term)  
                        && stripos($cityName, $search_term) !== false
                    ) {
                        $results[] = $city;
                    }
                }
            }
        }
        
        // Results are already sorted by population from the index
        return array_slice($results, 0, $limit);
    }
}
