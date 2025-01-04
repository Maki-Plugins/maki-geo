<?php

// Set up own category
add_filter(
    'block_categories_all', function ($categories, $post) {
        return array_merge(
            array(
            array(
                'slug'  => 'maki-geo-category',
                'title' => 'Maki Geo Blocks',
                'icon'  => 'location',
            ),
            ),
            $categories
        );
    }, 10, 2
);
