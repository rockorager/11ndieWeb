module.exports = {
  title: process.env.SITE_NAME,
  description: process.env.SITE_DESCRIPTION,
  url: new URL(process.env.URL).origin,
  logo: "/images/author.jpeg",
  author: {
    name: process.env.AUTHOR_NAME,
    email: process.env.AUTHOR_EMAIL,
  },
  theme: "no-style",
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_URL: process.env.REPOSITORY_URL,
  CONTEXT: process.env.CONTEXT,
  GITHUB_USER: new URL(process.env.REPOSITORY_URL).pathname.split("/")[1],
  GITHUB_REPO: new URL(process.env.REPOSITORY_URL).pathname.split("/")[2],
};
