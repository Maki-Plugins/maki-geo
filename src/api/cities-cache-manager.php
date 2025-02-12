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
        
        // First try exact prefix matches
        if (isset($this->indexed_cities[$prefix])) {
            // Add exact matches that start with the search term
            foreach ($this->indexed_cities[$prefix]['exactMatches'] as $city) {
                if (str_starts_with(strtolower($city['name']), $search_term)) {
                    $results[] = [
                        'name' => $city['name'],
                        'population' => $city['population'],
                        'countryCode' => $city['countryCode']
                    ];
                }
            }
            
            // If we don't have enough results, add partial matches
            if (count($results) < $limit) {
                foreach ($this->indexed_cities[$prefix]['partialMatches'] as $city) {
                    if (stripos($city['name'], $search_term) !== false) {
                        $results[] = [
                            'name' => $city['name'],
                            'population' => $city['population'],
                            'countryCode' => $city['countryCode']
                        ];
                    }
                }
            }
        }
        
        // Sort results by population
        usort(
            $results, function ($a, $b) {
                return $b['population'] - $a['population'];
            }
        );
        
        // Format final results
        return array_slice(
            array_map(
                function ($city) {
                    return sprintf('%s (%s)', $city['name'], $city['countryCode']);
                }, $results
            ),
            0,
            $limit
        );
    }
}
