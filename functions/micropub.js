const qs = require("querystring");
const axios = require("axios");
const site = require("../www/_data/site");
const { Base64 } = require("js-base64");
const { Octokit } = require("@octokit/rest");

// Dev
const events = {};

events.note = require("../www/_micropub/note.quill.json");
events.bookmark = require("../www/_micropub/bookmark.quill.json");
events.event = require("../www/_micropub/event.quill.json");
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

function templates(data) {
    // DON'T MESS WITH INDENTS
    const note = `---
title: ${data}
---`;
    console.log(note);
    return {
        note: {
            path: "www/posts/notes",
            frontmatter: note,
        },
    };
}

exports.handler = async (event, context) => {
    // 1. Get token endpoint from domain OR assume it's indieauth?
    // 2. Verify token in POST request with a GET request to token endpoint
    // 3. Request is valid, proceed with handling the request

    event = events.note;
    const testData = templates("testing");

    const data = function () {
        if (event.multiValueHeaders["Content-Type"][0] === "application/json") {
            return JSON.parse(event.body);
        } else {
            return qs.parse(event.body);
        }
    };

    if (
        !event.headers.hasOwnProperty("authorization") &&
        !data.hasOwnProperty("access_token")
    ) {
        return {
            statusCode: 401,
            body: "No access token provided",
        };
    }

    const token = event.headers.authorization || "Bearer " + data.access_token;
    let res = {};
    try {
        res = await axios.get("https://tokens.indieauth.com/token", {
            headers: {
                Accept: "application/json",
                Authorization: token,
            },
        });
    } catch {
        return {
            statusCode: 403,
            body: "Bad token",
        };
    }

    const scopes = res.data.scope.split(" ");

    if (event.queryStringParameters.hasOwnProperty("q")) {
        switch (event.queryStringParameters.q) {
            case "config":
                console.log("config query");
                return {
                    statusCode: 200,
                    body: {},
                };
            case "source":
                // return properties of source
                console.log("source query");
                return {
                    statusCode: 200,
                    body: {},
                };
            case "syndicate-to":
                //return syndication targets
                console.log("syndicate-to query");
                return {
                    statusCode: 200,
                    body: {},
                };
        }
    } else {
        console.log("No query param, committing event");
        // await commitContent(event, "Micropub received");

        await commitContent(testData.note.frontmatter, "Test");

        return {
            statusCode: 201,
            body: "All good",
            headers: {
                location: "https://www.timculverhouse.com",
            },
        };
    }

    /*



    const scope = res.data.scope.split(" ");
    const date = new Date().toISOString();

// Note

    var content = `
---
layout: layouts/note
type: note
date: ${date}
---
${data.content}
    `;

// Article
    content = `
---
title: ${data.name}
layout: layouts/article
type: article
date: ${date}
---
${data.content}
    `;

// Reply
    content = `
---
title: ${data.name}
layout: layouts/reply
type: reply
date: ${date}
---
${data.content}
    `;
    const filename = new Date().toISOString().split("T")[0] + "-" + data["mp-slug"] + ".md";

    console.log(data);
*/

    //https://micropub.spec.indieweb.org/#create-p-1
    // Methods
    // Create: h-entry is default default
    // Check if the content-type is application/json or form encoded?
};
