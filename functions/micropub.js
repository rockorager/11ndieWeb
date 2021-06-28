const qs = require("querystring");
const axios = require("axios");
const site = require("../www/_data/site");
const { Base64 } = require("js-base64");
const { Octokit } = require("@octokit/rest");
const mpHelper = require('../lib/micropub-helper');

// Dev
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

const octokit = new Octokit({
    auth: site.GITHUB_TOKEN,
});

const commitContent = async (content, message) => {
    let repoPath = new URL(site.GITHUB_URL).pathname.split("/");
    let date = new Date().toISOString();

    let microPubPath = "www/_micropub/" + date;
    console.log(microPubPath);
    const commit = {
        owner: repoPath[1],
        repo: repoPath[2],
        path: microPubPath,
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

function templates(mp) {
    switch(mp.postType)
    // DON'T MESS WITH INDENTS
    const note = `---
title: ${mp.properties.name[0]}
---`;
    console.log(note);
    return {
        note: {
            path: "www/posts/notes",
            post: note,
        },
    };
}

function postTypeDiscovery (mf2) {
    if(mf2.type[0] === "h-event") {
        return "event";
    }
    if(mf2.properties.hasOwnProperty("rsvp")) {
        return "rsvp";
    }
    if(mf2.properties.hasOwnProperty("repost-of")) {
        return "repost-of";
    }
    if(mf2.properties.hasOwnProperty("like-of")) {
        return "like-of";
    }
    if(mf2.properties.hasOwnProperty("bookmark-of")) {
        return "bookmark-of";
    }
    if(mf2.properties.hasOwnProperty("in-reply-to")) {
        return "reply";
    }
    if(mf2.properties.hasOwnProperty("name")) {
        if(mf2.properties.name[0] != ''){
            return "article";
        }
    }

    return "note";
}

exports.handler = async (event, context) => {

    event = events.note2;
    const testData = templates("testing");
    console.log()
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

    if(mpData.type) {
        // handle post and return
            mpData.postType = postTypeDiscovery(mpData);
    console.log(mpData);
        return mpData;
    }

    return {statusCode: 500, body: "Server error"};

    //https://micropub.spec.indieweb.org/#create-p-1
    // Methods
    // Create: h-entry is default default
    // Check if the content-type is application/json or form encoded?
};
