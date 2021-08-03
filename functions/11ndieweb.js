const options = {"functionsDirectory":"functions","dataDirectory":"www/_data","acceptedDomains":["11ndieweb.netlify.app"],"tokenEndpoint":"https://tokens.indieauth.com/token"};
const indieweb = require("eleventy-plugin-11ndieweb");


exports.handler = async function (event) {

  switch (event.path.split("/")[2]) {
    case "webmention":
      return indieweb.webmention(event, options.dataDirectory, options.acceptedDomains);
    case "micropub":
      return indieweb.micropub(event, options);
    default:
      return {
        statusCode: 404,
        body: "Page not found",
      };
  }
};

