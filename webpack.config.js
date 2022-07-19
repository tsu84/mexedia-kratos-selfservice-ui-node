const path = require("path")
const sass = require("sass")
const autoprefixer = require("autoprefixer")

module.exports = {
  mode: "production", // development/testing/staging/production
  entry: "./src/public/index.js", // The entry point where module bundler fetches file to be converted
  output: {
    path: path.resolve("public", "dist"), // The absolute path of your dist folder
    filename: "bundle.js", // The filename of your final JS bundled file
  },
  // watch: true,
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: {
              importLoaders: 2,
              sourceMap: true,
            },
          },
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                // `autoprefixer` is a requirement for carbon core Sass code
                plugins: [autoprefixer],
              },
            },
          },
          {
            loader: "sass-loader",
            options: {
              implementation: sass,
              sassOptions: {
                includePaths: ["node_modules"],
                // `enable-css-custom-properties` and `grid-columns-16` feature flags
                // are requirements for carbon for IBM.com styles
                data: `
                  $feature-flags: (
                    enable-css-custom-properties: true,
                    grid-columns-16: true,
                  );
                `,
              },
            },
          },
        ],
      },
    ],
  },
}
