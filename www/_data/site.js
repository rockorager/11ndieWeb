module.exports = {
    title: process.env.SITE_NAME,
    description: process.env.SITE_DESCRIPTION,
    url: process.env.URL,
    logo: "/images/author.jpeg",
    author: {
        name: process.env.AUTHOR_NAME,
        email: process.env.AUTHOR_EMAIL
    },
    theme: "no-style",
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_URL: process.env.GITHUB_URL,
    CONTEXT: process.env.CONTEXT
};