/**
 * |-| [- |_ | /\ ( ~|~ `/ |_
 *
 * Heliactyl 14.11.0 ― Cascade Ridge
 *
 * This is for the frontend pages and routes.
 * @module pages
*/

const indexjs = require("../app.js");
const ejs = require("ejs");
const express = require("express");
const settings = require("../settings.json");
const fetch = require("node-fetch");
const arciotext = require("../misc/afk");

module.exports.load = async function (app, db) {
  app.all("/", async (req, res) => {
    try {
      if (
        req.session.pterodactyl &&
        req.session.pterodactyl.id !==
          (await db.get("users-" + req.session.userinfo.id))
      ) {
        return res.redirect("/login?prompt=none");
      }

      let theme = indexjs.get(req);
      if (
        theme.settings.mustbeloggedin.includes(req._parsedUrl.pathname) &&
        (!req.session.userinfo || !req.session.pterodactyl)
      ) {
        return res.redirect("/login");
      }

      if (theme.settings.mustbeadmin.includes(req._parsedUrl.pathname)) {
        let str = await renderTemplate(
          theme,
          indexjs.renderdataeval,
          req,
          res,
          db
        );
        res.send(str);
        return;
      }

      let str = await renderTemplate(
        theme,
        indexjs.renderdataeval,
        req,
        res,
        db
      );
      res.send(str);
    } catch (err) {
      console.log(err);
      res.render("500.ejs", { err });
    }
  });

  app.use("/assets", express.static("./assets"));
};

async function renderTemplate(theme, renderdataeval, req, res, db) {
  return new Promise(async (resolve, reject) => {
    ejs.renderFile(
      `./views/${theme.settings.index}`,
      await eval(renderdataeval),
      null,
      async function (err, str) {
        if (err) {
          reject(err);
          return;
        }

        delete req.session.newaccount;
        resolve(str);
      }
    );
  });
}
