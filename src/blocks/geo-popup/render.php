<?php
function render_geo_popup_block($attributes, $content) {
    $wrapper_attributes = get_block_wrapper_attributes([
        'class' => 'geo-popup-overlay',
        'style' => 'display: none;'
    ]);

    return sprintf(
        '<div %s>%s</div>',
        $wrapper_attributes,
        $content
    );
}
