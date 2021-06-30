const site = require('./www/_data/site');

module.exports = function (eleventyConfig) {
    console.log(site);
    // Passthrough files
    eleventyConfig.addPassthroughCopy({ "www/images": "images" });
    eleventyConfig.addPassthroughCopy("www/**/*.css");
    eleventyConfig.addPassthroughCopy({ "www/admin": "admin" });
    eleventyConfig.addPassthroughCopy("www/favicon.*");
    
    // Filters
    eleventyConfig.addFilter("where", function(arr, key, value){
        return arr.filter(function (item) {
            return (item[key] === value);
            });
    });
    eleventyConfig.addFilter("pluralize", function(value){
        switch (value){
            case "reply": return "replies";
            case "article": return "articles";
            case "bookmark": return "bookmarks";
            case "like": return "likes";
            case "repost": return "reposts";

            default: return value+"s";
        };
    });

    // Collections
    eleventyConfig.addCollection("posts", function(collectionApi) {
        return collectionApi.getFilteredByGlob("www/posts/*").reverse();
      });
    eleventyConfig.addCollection("articles", function(collectionApi) {
        return collectionApi.getFilteredByGlob("www/posts/articles").reverse();
        });
    eleventyConfig.addCollection("bookmarks", function(collectionApi) {
        return collectionApi.getFilteredByGlob("www/posts/bookmarks").reverse();
        });
    eleventyConfig.addCollection("notes", function(collectionApi) {
        return collectionApi.getFilteredByGlob("www/posts/notes").reverse();
        });
    eleventyConfig.addCollection("replies", function(collectionApi) {
        return collectionApi.getFilteredByGlob("www/posts/replies").reverse();
        });
    eleventyConfig.addCollection("reposts", function(collectionApi) {
        return collectionApi.getFilteredByGlob("www/posts/reposts").reverse();
        });
    eleventyConfig.addCollection("reading", function(collectionApi) {
        return collectionApi.getFilteredByGlob("www/posts/reading").reverse();
        });
    eleventyConfig.addCollection("favorites", function(collectionApi) {
        return collectionApi.getFilteredByGlob("www/posts/favorites").reverse();
        });
    eleventyConfig.addCollection("events", function(collectionApi) {
        return collectionApi.getFilteredByGlob("www/posts/events").reverse();
        });
    eleventyConfig.addCollection("rsvps", function(collectionApi) {
        return collectionApi.getFilteredByGlob("www/posts/rsvps").reverse();
        });

    // Quiet mode
    eleventyConfig.setQuietMode(true);

    // Files to convert are in www
    return {
        dir: {
            input: "www",
            includes: "_themes/"+site.theme
        },
    };
};


