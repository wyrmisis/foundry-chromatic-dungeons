module.exports = {
    "plugins": [
        require('postcss-import'),
        require('stylelint'),
        require("autoprefixer"),
        require('postcss-nested'),
        require('cssnano'),
        require('postcss-reporter'),
    ]
}