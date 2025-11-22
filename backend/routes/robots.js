/**
 * 🤖 Irisje.nl – Dynamische robots.txt
 * Staat crawlers toe om de site te indexeren en verwijst naar de sitemap.
 */

const BASE_URL = "https://irisje.nl";

module.exports = (req, res) => {
  const robotsTxt = `
User-agent: *
Disallow:

Sitemap: ${BASE_URL}/sitemap.xml
Host: ${BASE_URL.replace("https://", "")}
`;

  res
    .status(200)
    .type("text/plain")
    .set("Cache-Control", "public, max-age=86400")
    .send(robotsTxt.trim());
};
