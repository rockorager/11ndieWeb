const options = {"functionsDirectory":"functions","dataDirectory":"www/_data","acceptedDomains":["11ndieweb.netlify.app"],"tokenEndpoint":"https://tokens.indieauth.com/token"};
const indieweb = require("eleventy-plugin-11ndieweb");

function getGithubInfo(info) {
  let github;
  let user;
  let repo;
  try {
    github = new URL(process.env.REPOSITORY_URL).pathname.split("/");
    user = github[1];
    repo = github[2];
  } catch(err) {
    github = process.env.REPOSITORY_URL.slice(15).split("/");
    user = github[0];
    repo = github[1];
  }
  
  if (info === "user"){
    return user;
  } else {
    return repo;
  }
}

options.site = {
  url: new URL(process.env.URL).origin,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_URL: process.env.REPOSITORY_URL,
  GITHUB_USER: getGithubInfo("user"),
  GITHUB_REPO: getGithubInfo("repo")
};

exports.handler = async function (event) {

  switch (event.path.split("/")[2]) {
    case "webmention":
      return indieweb.webmention(event, options);
    case "micropub":
      return indieweb.micropub(event, options);
    default:
      return {
        statusCode: 404,
        body: "Page not found",
      };
  }
};

