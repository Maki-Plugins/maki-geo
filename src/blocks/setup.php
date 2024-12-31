<?php

// Set up own category
add_filter('block_categories_all', function ($categories, $post) {
    return array_merge(
        array(
            array(
                'slug'  => 'geoutils-category',
                'title' => 'GeoUtils Blocks',
                'icon'  => 'location',
            ),
        ),
        $categories
    );
}, 10, 2);
