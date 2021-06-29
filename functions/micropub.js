const qs = require("querystring");
const axios = require("axios");
const site = require("../www/_data/site");
const { Base64 } = require("js-base64");
const { Octokit } = require("@octokit/rest");
const mpHelper = require('../lib/micropub-helper');
const slugify = require('slugify');

// Dev
/*
const events = {};

events.note = require("../www/_micropub/note.quill.json");
events.bookmark = require("../www/_micropub/bookmark.quill.json");
events.event = require("../www/_micropub/event.quill.json");
events.query = require("../www/_micropub/config.quill.json");
events.article = require("../www/_micropub/article-with-photo.quill.json");
events.like = require("../www/_micropub/like.quill.json");
events.noteWithPhoto = require("../www/_micropub/note-with-photo.quill.json");
events.note2 = require("../www/_micropub/note.indigenous.json");
// end Dev block
*/

const octokit = new Octokit({
    auth: site.GITHUB_TOKEN,
});

const commitContent = async (content, message, path) => {
    let repoPath = new URL(site.GITHUB_URL).pathname.split("/");

    
    const commit = {
        owner: repoPath[1],
        repo: repoPath[2],
        path: path,
    };

    const contentEncoded = Base64.encode(content);

    if (site.CONTEXT === "production") {
        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner: commit.owner,
            repo: commit.repo,
            path: commit.path,
            message: message,
            content: contentEncoded,
            committer: {
                name: `11ndieWeb`,
                email: site.author.email,
            },
            author: {
                name: "11ndieweb",
                email: site.author.email,
            },
        });
    } else {
        // console.log(content);
    }
};

function fileTemplate(mp) {
    let post = `---\r\n`;
    let data = mp.properties;
    let date = new Date().toISOString();
    
    
    let keys = Object.keys(data);
    keys.forEach(function(key){
        if(key === 'name'){
            post = post + `title: ${data[key]}\r\n`;
        } else if(key === 'published') {
            post = post + `date: ${data[key]}\r\n`;
        } else if(key === 'category'){
            post = post + `tags: [${data.category}]\r\n`;
        } else if(key === 'content') {
            //skip
        } else {
            post = post + `${key}: ${data[key]}\r\n`;
        }
    });

    post = post + `---\r\n`;

    if(data.hasOwnProperty('content')){
        if(typeof data.content[0] === 'object') {
            post = post + `${data.content[0].html}`;
        } else {
            post = post + `${data.content}`;
        }
    }

    return {
        note: {
            path: "www/posts/notes",
            post: post,
        },
    };
}

function postTypeDiscovery (mf2) {
    if(mf2.type[0] === "h-event") {
        mf2.postType = "event";
        mf2.path = "www/events";
    }
    if(mf2.properties.hasOwnProperty("rsvp")) {
        mf2.postType = "rsvp";
        mf2.path = "www/posts/rsvps";
    }
    if(mf2.properties.hasOwnProperty("repost-of")) {
        mf2.postType = "repost-of";
        mf2.path = "www/posts/reposts";
    }
    if(mf2.properties.hasOwnProperty("like-of")) {
        mf2.postType = "like-of";
        mf2.path = "www/posts/likes";
    }
    if(mf2.properties.hasOwnProperty("bookmark-of")) {
        mf2.postType = "bookmark-of";
        mf2.path = "www/posts/bookmarks";
    }
    if(mf2.properties.hasOwnProperty("in-reply-to")) {
        mf2.postType = "reply";
        mf2.path = "www/posts/replies";
    }
    if(mf2.properties.hasOwnProperty("name")) {
        if(mf2.properties.name[0] != ''){
            mf2.postType = "article";
            mf2.path = "www/posts/articles";
        }
    }

    return mf2;
}

exports.handler = async (event, context) => {

    event = events.like;
    // TODO Assume it's indieauth now, integrate self hosted tokens
    let mpData = await mpHelper(event, 'https://tokens.indieauth.com/token');

    // Check scopes

    if(mpData.statusCode != 200) {
        return mpData;
    }

    if(mpData.query) {
        switch(mpData.query){
            case 'config':
                // get config and return
                return mpData;
            case 'source':
                // get source data and return
                return mpData;
            case 'syndicate-to':
                // get syndications and return
                return mpData;
        }
    }

    let slug = '';

    if(mpData.properties.hasOwnProperty('mp-slug')) {
        slug = slugify(mpData.properties['mp-slug'][0], {lower:true,strict:true});
        delete mpData.properties['mp-slug'];
    } else if(mpData.properties.hasOwnProperty('name')) {
        slug = slugify(mpData.properties.name[0], {lower:true,strict:true});
    } else if(mpData.properties.hasOwnProperty('content')){
        // first 25 characters of content is slug
        if(typeof mpData.properties.content[0] === 'object') {
            slug = slugify(mpData.properties.content[0].html.substr(0,30), {lower:true,strict:true});
        } else {
            slug = slugify(mpData.properties.content[0].substr(0,30), {lower:true,strict:true});
        }
    } else {
        slug = slugify(JSON.stringify(mpData.properties).substr(0,30), {lower:true,strict:true});
    }

    let date = new Date().toISOString().split('T')[0];

    if(mpData.properties.hasOwnProperty('published')) {
        date = new Date(mpData.properties.published[0]).toISOString;
    } else {
        mpData.properties.published = new Date().toISOString();
    }

    date = date.split('T')[0];

    let filename = date + '-' + slug + '.md';

    if(mpData.type) {
        // handle post and return
        mpData = postTypeDiscovery(mpData);
        let markdown = fileTemplate(mpData);
        let path = mpData.path + '/' + filename;
        await commitContent(markdown, `Add new ${mpData.postType} ${filename}`, path);
        return mpData;
    }

    return {statusCode: 500, body: "Server error"};

    //https://micropub.spec.indieweb.org/#create-p-1
    // Methods
    // Create: h-entry is default default
    // Check if the content-type is application/json or form encoded?
};
