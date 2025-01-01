<?php
function render_geo_popup_block($attributes, $content) {
    $wrapper_attributes = get_block_wrapper_attributes([
        'class' => 'geo-popup-overlay',
        'style' => 'display: none;'
    ]);

    // Ensure content is wrapped in container
    if (strpos($content, 'geo-popup-container') === false) {
        $content = '<div class="geo-popup-container">' . $content . '</div>';
    }

    return sprintf(
        '<div %s>%s</div>',
        $wrapper_attributes,
        $content
    );
}
