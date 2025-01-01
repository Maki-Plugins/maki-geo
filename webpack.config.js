const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
    ...defaultConfig,
    entry: {
        'geo-popup': './src/blocks/geo-popup/geo-popup.js',
        'popup-handler': './src/blocks/geo-popup/popup-handler.js',
        'admin': './src/admin/index.js',
        'components': './src/components/geo-rules/index.js'
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js'
    }
};
