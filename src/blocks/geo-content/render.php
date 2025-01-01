<?php

/**
 * PHP file to use when rendering the block type on the server to show on the front end.
 *
 * The following variables are exposed to the file:
 *     $attributes (array): The block attributes.
 *     $content (string): The block default content.
 *     $block (WP_Block): The block instance.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */

$block_id = wp_unique_id('gu-geo-target-');
$wrapped_content = sprintf(
    '<div class="gu-geo-target-block" id="%s" style="display: none;" data-rules="%s">%s</div>',
    esc_attr($block_id),
    esc_attr(wp_json_encode($attributes['localRules'] ?? [])),
    esc_attr(wp_json_encode($attributes['globalRuleIds'] ?? [])),
    $content
);

wp_enqueue_script('geo-target-frontend');
echo $wrapped_content;
