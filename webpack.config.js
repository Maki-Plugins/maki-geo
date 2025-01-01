const defaultConfig = require("@wordpress/scripts/config/webpack.config");
const path = require("path");
const glob = require("glob");

// Helper to maintain directory structure
function getEntries() {
    const entries = {};
    
    // Get all JS files from blocks and components
    const jsFiles = glob.sync("./src/{blocks/**/!(*test|*spec).js,components/**/*.js}");
    jsFiles.forEach(file => {
        // Convert path/to/file.js to path/to/file as entry name
        const entryName = file
            .replace("./src/", "")
            .replace(/\.[^/.]+$/, "");
        entries[entryName] = file;
    });

    // Add admin entry point
    entries["admin/index"] = "./src/admin/index.js";

    return entries;
}

module.exports = {
    ...defaultConfig,
    entry: getEntries(),
    output: {
        path: path.resolve(__dirname, "build"),
        filename: "[name].js"
    },
    module: {
        ...defaultConfig.module,
        rules: [
            ...defaultConfig.module.rules,
            {
                test: /\.css$/,
                exclude: /node_modules/,
                use: [
                    "style-loader",
                    "css-loader"
                ]
            }
        ]
    }
};
