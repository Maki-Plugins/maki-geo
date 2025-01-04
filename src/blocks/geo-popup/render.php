<?php

$block_id = wp_unique_id('gu-geo-popup-');
$wrapper_attributes = get_block_wrapper_attributes(
    [
    'class' => 'geo-popup-overlay',
    'id' => $block_id,
    'style' => 'display: none;',
    'data-rules' => esc_attr(wp_json_encode($attributes['localRule'] ?? $attributes['globalRuleId'] ?? []))
    ]
);

// Ensure content is wrapped in container
if (strpos($content, 'geo-popup-container') === false) {
    $container_attrs = sprintf(
        'class="geo-popup-container" data-trigger="%s" data-delay="%d"',
        esc_attr($attributes['triggerType']),
        intval($attributes['triggerDelay'])
    );
    $content = sprintf('<div %s>%s</div>', $container_attrs, $content);
}

wp_enqueue_script('geo-target-frontend');

echo sprintf(
    '<div %s>%s</div>',
    $wrapper_attributes,
    $content
);

