const qs = require('querystring');
const { Octokit } = require('@octokit/rest');
const { Base64 } = require('js-base64');
const crypto = require('crypto');
const wmverifier = require('webmention-verifier');
const URL = require('url').URL;
const site = require('../src/_data/site');


const octokit = new Octokit({
    auth: site.GITHUB_TOKEN
});

// Functions

const getWebmentions = async () => {
    //TODO this process env url doens't work on netlify build?
    let repoPath = new URL(site.GITHUB_URL).pathname.split("/");
    
    const webmentions = {
        owner:   repoPath[1],
        repo:    repoPath[2],
        path:    "src/_data/webmentions.json"
    };

    try { 
        const { data } = await octokit.rest.repos.getContent({
            owner: repoPath[1],
            repo:  repoPath[2],
            path:  "src/_data/webmentions.json"
        });

        webmentions.content = JSON.parse(Base64.decode(data.content));
        webmentions.sha = data.sha;
    } catch(err) {
        webmentions.content = {
            "type": "feed",
            "name": "Webmentions",
            "children": []
        }
    }

    return webmentions;
};

const commitMention = async (webmentions, message) => {
    const contentEncoded = Base64.encode(JSON.stringify(webmentions.content));
    const { data } = await octokit.repos.createOrUpdateFileContents({

      owner:        webmentions.owner,
      repo:         webmentions.repo,
      path:         webmentions.path,
      sha:          webmentions.sha,
      message:      message,
      content:      contentEncoded,
      committer: {
        name:       'Webmention receiver',
        email:      "tim@timculverhouse.com",
      },
      author: {
        name:       'Webmention receiver',
        email:      "tim@timculverhouse.com",
      },
    });
};

const commitError = async (errorMsg, message) => {
    let repoPath = new URL(site.GITHUB_URL).pathname.split("/");
    
    const errors = {
        owner:   repoPath[1],
        repo:    repoPath[2],
        path:    "src/_data/errors.json"
    };

    try { 
        const { data } = await octokit.rest.repos.getContent({
            owner: repoPath[1],
            repo:  repoPath[2],
            path:  "src/_data/errors.json"
        });

        errors.content = JSON.parse(Base64.decode(data.content));
        errors.sha = data.sha;
    } catch(err) {
        errors.content = {
            "type": "Feed",
            "name": "Errors",
            "children": []
        }
    }

    errors.content.children.splice(0,0,errorMsg);

    const contentEncoded = Base64.encode(JSON.stringify(errors.content));
    const { data } = await octokit.repos.createOrUpdateFileContents({

      owner:        errors.owner,
      repo:         errors.repo,
      path:         errors.path,
      sha:          errors.sha,
      message:      message,
      content:      contentEncoded,
      committer: {
        name:       `11ndieweb`,
        email:      "tim@timculverhouse.com",
      },
      author: {
        name:       "11ndieweb",
        email:      "tim@timculverhouse.com",
      },
    });

}


exports.handler = async (event, context) => {
    const data = qs.parse(event.body);
    data.target = decodeURI(data.target);
    data.source = decodeURI(data.source);

    const res = await wmverifier(data.source,data.target,['www.timculverhouse.com','timculverhouse.com'])
    const mention = res.webmention;

    if(mention === false) {
        let errorMsg = {
            statusCode: res.statusCode,
            error: res.body,
            source: data.source
        };
        await commitError(errorMsg, "Faulty webmention received");
        return res;
    }


    const webmentions = await getWebmentions();
    // See if target/source combo already exist
    var comboIndex = -1;
    for (let i in webmentions.content.children) {
        if (webmentions.content.children[i]["wm-source"] === data.source && webmentions.content.children[i]["wm-target"] === data.target) {
            comboIndex = i;
        }
    }

    if (comboIndex >=0) {
        // Update existing mention
        Object.assign(webmentions.content.children[comboIndex],mention);
        let str = "Update webmention from " + data.source;
        await commitMention(webmentions, str);
    } else {
        // New mention
        mention["wm-received"] = new Date().toISOString();
        mention["wm-id"] = crypto.randomBytes(12).toString('hex');
        webmentions.content.children.splice(0,0,mention);
        let str = "Add webmention from " + data.source;
        await commitMention(webmentions, str);
    }

    return {
        statusCode: 200,
        body: "Success!"
    };
  };