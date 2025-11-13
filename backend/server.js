/**
 * irisje.nl – server entrypoint
 * volledig gecontroleerd en opgeschoond – 2025-11-13
 */

require("dotenv").config();
require("./config/validateenv");

const express = require("express");
const mongoose = require("mongoose");
const compression = require("compression");
const cookieparser = require("cookie-parser");
const fs = require("fs");
const path = require("path");

const { corsemiddleware, securityheaders } = require("./config/security");
const { addlog, route: logroute } = require("./utils/logger");
const { startupbanner } = require("./utils/loghelper");

const app = express();

/* ============================================================
   basis middleware
============================================================ */
app.use(express.json({ limit: "1mb" }));
app.use(cookieparser());
app.use(compression());
app.use(corsemiddleware);
app.use(securityheaders);

/* ============================================================
   request logging
============================================================ */
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    logroute?.(req.method, req.originalUrl, res.statusCode, ms);
  });
  next();
});

/* ============================================================
   mongodb connectie
============================================================ */
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!uri) {
  addlog("mongodb uri ontbreekt", "error");
  process.exit(1);
}

mongoose
  .connect(uri)
  .then(() => addlog("mongodb connected", "info"))
  .catch((err) => addlog("mongodb connection error: " + err.message, "error"));

/* ============================================================
   publieke bestanden
============================================================ */
app.use(express.static(path.join(__dirname, "public")));

/* ============================================================
   api-routes
============================================================ */
const routes = [
  "auth",
  "companies",
  "requests",
  "publicrequests",
  "reviews",
  "admin",
  "email",
  "payments",
  "status",
  "claims",
  "googlereviews",
  "seed",
  "importer_places",
];

for (const route of routes) {
  try {
    app.use(`/api/${route}`, require(`./routes/${route}`));
  } catch (err) {
    addlog(`route '${route}' kon niet geladen worden: ${err.message}`, "error");
  }
}

/* ============================================================
   robots.txt
============================================================ */
app.get("/robots.txt", (req, res) => {
  try {
    require("./routes/robots")(req, res);
  } catch (err) {
    addlog("robots.txt fout: " + err.message, "error");
    res.type("text/plain").send("");
  }
});

/* ============================================================
   sitemap (1 consistente handler, geen dubbele mapping!)
============================================================ */

app.get("/sitemap.xml", (req, res) => {
  try {
    // redirect alleen wanneer frontend wordt bezocht
    if (req.hostname === "irisje.nl") {
      return res.redirect(
        301,
        "https://irisje-backend.onrender.com/sitemap.xml"
      );
    }

    // backend sitemap generator
    require("./routes/sitemap")(req, res);

  } catch (err) {
    addlog("sitemap fout: " + err.message, "error");
    res.type("application/xml").send("<urlset></urlset>");
  }
});

/* ============================================================
   test
============================================================ */
app.get("/api/test", (req, res) => {
  addlog("api test", "debug");
  res.json({ ok: true });
});

/* ============================================================
   system check
============================================================ */
app.get("/api/check", (req, res) => {
  res.json({
    ok: true,
    routes: routes.map((r) => `/api/${r}`),
    message: "routes actief",
  });
});

/* ============================================================
   image-handler
============================================================ */
app.get(/\.(jpg|jpeg|png)$/i, (req, res, next) => {
  const original = path.join(__dirname, "../frontend", req.path);
  const webp = original.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  const acceptwebp = req.headers.accept?.includes("image/webp");

  if (acceptwebp && fs.existsSync(webp)) return res.sendFile(webp);
  if (fs.existsSync(original)) return res.sendFile(original);

  next();
});

/* ============================================================
   /img map
============================================================ */
app.use(
  "/img",
  express.static(path.join(__dirname, "../frontend/img"), {
    setHeaders(res, file) {
      if (/\.(png|jpg|jpeg|webp|svg|ico)$/i.test(file)) {
        res.setHeader("cache-control", "public, max-age=604800, immutable");
      } else {
        res.setHeader("cache-control", "no-store");
      }
    },
  })
);

/* ============================================================
   frontend statische bestanden
============================================================ */
const frontendpath = path.join(__dirname, "../frontend");

app.use(
  express.static(frontendpath, {
    setHeaders(res, file) {
      if (/\.(css|js|png|jpg|jpeg|webp|svg|ico)$/i.test(file)) {
        res.setHeader("cache-control", "public, max-age=604800, immutable");
      } else {
        res.setHeader("cache-control", "no-store");
      }
    },
  })
);

/* ============================================================
   html optimalisatie
============================================================ */
app.use(/.*\.html$/, (req, res, next) => {
  const file = path.join(frontendpath, req.path);
  if (!fs.existsSync(file)) return next();

  let html = fs.readFileSync(file, "utf8");

  if (html.includes("<head>") && !html.includes("fonts.googleapis.com")) {
    html = html.replace(
      "<head>",
      `<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
`
    );
  }

  if (!html.includes("js/lazyload.js")) {
    html = html.replace(
      "</body>",
      `  <script src="js/lazyload.js"></script>\n</body>`
    );
  }

  if (req.path === "/status.html") {
    html = html.replace(
      "</body>",
      `  <script src="js/status-enhanced.js"></script>\n</body>`
    );
  }

  res.type("html").send(html);
});

/* ============================================================
   fallback: index.html (spa)
============================================================ */
app.get(/^\/(?!api\/|.*\.(xml|txt)$).*/, (req, res) => {
  res.sendFile(path.join(frontendpath, "index.html"));
});

/* ============================================================
   starten
============================================================ */
const port = process.env.PORT || 3000;
startupbanner();
addlog(`server gestart op poort ${port}`, "info");

app.listen(port, () => {
  addlog(`server actief (${process.env.NODE_ENV || "development"})`, "info");
});
