/**
 * |-| [- |_ | /\ ( ~|~ `/ |_
 *
 * Heliactyl 14.11.0 ― Cascade Ridge
 *
 * This file acts as the API for the Heliactyl application.
 * @module api
*/

const indexjs = require("../app.js");
const adminjs = require("./admin.js");
const fs = require("fs");
const ejs = require("ejs");
const fetch = require("node-fetch");
const NodeCache = require("node-cache");
const Queue = require("../managers/Queue.js");
const log = require("../misc/log");
const arciotext = require("../misc/afk");

const myCache = new NodeCache({ deleteOnExpire: true, stdTTL: 59 });

module.exports.load = async function (app, db) {
  /**
   * GET /api
   * Returns the status of the API.
   */
  app.get("/api", async (req, res) => {
    /* Check that the API key is valid */
    let authentication = await check(req, res);
    if (!authentication ) return;
    res.send({
      status: true,
    });
  });

  /**
   * GET /api/v2/userinfo
   * Returns the user information.
   */
  app.get("/api/v2/userinfo", async (req, res) => {
    /* Check that the API key is valid */
    let authentication = await check(req, res);
    if (!authentication ) return;

    if (!req.query.id) return res.send({ status: "missing id" });

    if (!(await db.get("users-" + req.query.id)))
      return res.send({ status: "invalid id" });

    let newsettings = JSON.parse(fs.readFileSync("./settings.json").toString());

    if (newsettings.api.client.oauth2.link.slice(-1) == "/")
      newsettings.api.client.oauth2.link =
        newsettings.api.client.oauth2.link.slice(0, -1);

    if (newsettings.api.client.oauth2.callbackpath.slice(0, 1) !== "/")
      newsettings.api.client.oauth2.callbackpath =
        "/" + newsettings.api.client.oauth2.callbackpath;

    if (newsettings.pterodactyl.domain.slice(-1) == "/")
      newsettings.pterodactyl.domain = newsettings.pterodactyl.domain.slice(
        0,
        -1
      );

    let packagename = await db.get("package-" + req.query.id);
    let package =
      newsettings.api.client.packages.list[
        packagename ? packagename : newsettings.api.client.packages.default
      ];
    if (!package)
      package = {
        ram: 0,
        disk: 0,
        cpu: 0,
        servers: 0,
      };
    package["name"] = packagename;

    let pterodactylid = await db.get("users-" + req.query.id);
    let userinforeq = await fetch(
      newsettings.pterodactyl.domain +
        "/api/application/users/" +
        pterodactylid +
        "?include=servers",
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newsettings.pterodactyl.key}`,
        },
      }
    );
    if ((await userinforeq.statusText) == "Not Found") {
      console.log(
        "App ― An error has occured while attempting to get a user's information"
      );
      console.log("- Discord ID: " + req.query.id);
      console.log("- Pterodactyl Panel ID: " + pterodactylid);
      return res.send({ status: "could not find user on panel" });
    }
    let userinfo = await userinforeq.json();

    res.send({
      status: "success",
      package: package,
      extra: (await db.get("extra-" + req.query.id))
        ? await db.get("extra-" + req.query.id)
        : {
            ram: 0,
            disk: 0,
            cpu: 0,
            servers: 0,
          },
      userinfo: userinfo,
      coins:
        newsettings.api.client.coins.enabled == true
          ? (await db.get("coins-" + req.query.id))
            ? await db.get("coins-" + req.query.id)
            : 0
          : null,
    });
  });

  /**
   * POST /api/v2/setcoins
   * Sets the number of coins for a user.
   */
  app.post("/api/v2/setcoins", async (req, res) => {
    /* Check that the API key is valid */
    let authentication = await check(req, res);
    if (!authentication ) return;

    if (typeof req.body !== "object")
      return res.send({ status: "body must be an object" });
    if (Array.isArray(req.body))
      return res.send({ status: "body cannot be an array" });
    let id = req.body.id;
    let coins = req.body.coins;
    if (typeof id !== "string")
      return res.send({ status: "id must be a string" });
    if (!(await db.get("users-" + id)))
      return res.send({ status: "invalid id" });
    if (typeof coins !== "number")
      return res.send({ status: "coins must be number" });
    if (coins < 0 || coins > 999999999999999)
      return res.send({ status: "too small or big coins" });
    if (coins == 0) {
      await db.delete("coins-" + id);
    } else {
      await db.set("coins-" + id, coins);
    }
    res.send({ status: "success" });
  });

  /**
   * POST /api/v2/setplan
   * Sets the plan for a user.
   */
  app.post("/api/v2/setplan", async (req, res) => {
    /* Check that the API key is valid */
    let authentication = await check(req, res);
    if (!authentication ) return;

    if (!req.body) return res.send({ status: "missing body" });

    if (typeof req.body.id !== "string")
      return res.send({ status: "missing id" });

    if (!(await db.get("users-" + req.body.id)))
      return res.send({ status: "invalid id" });

    if (typeof req.body.package !== "string") {
      await db.delete("package-" + req.body.id);
      adminjs.suspend(req.body.id);
      return res.send({ status: "success" });
    } else {
      let newsettings = JSON.parse(
        fs.readFileSync("./settings.json").toString()
      );
      if (!newsettings.api.client.packages.list[req.body.package])
        return res.send({ status: "invalid package" });
      await db.set("package-" + req.body.id, req.body.package);
      adminjs.suspend(req.body.id);
      return res.send({ status: "success" });
    }
  });

  /**
   * POST /api/v2/setresources
   * Sets the resources for a user.
   */
  app.post("/api/v2/setresources", async (req, res) => {
    /* Check that the API key is valid */
    let authentication = await check(req, res);
    if (!authentication ) return;

    if (!req.body) return res.send({ status: "missing body" });

    if (typeof req.body.id !== "string")
      return res.send({ status: "missing id" });

    if (!(await db.get("users-" + req.body.id)))
      res.send({ status: "invalid id" });

    if (
      typeof req.body.ram == "number" ||
      typeof req.body.disk == "number" ||
      typeof req.body.cpu == "number" ||
      typeof req.body.servers == "number"
    ) {
      let ram = req.body.ram;
      let disk = req.body.disk;
      let cpu = req.body.cpu;
      let servers = req.body.servers;

      let currentextra = await db.get("extra-" + req.body.id);
      let extra;

      if (typeof currentextra == "object") {
        extra = currentextra;
      } else {
        extra = {
          ram: 0,
          disk: 0,
          cpu: 0,
          servers: 0,
        };
      }

      if (typeof ram == "number") {
        if (ram < 0 || ram > 999999999999999) {
          return res.send({ status: "ram size" });
        }
        extra.ram = ram;
      }

      if (typeof disk == "number") {
        if (disk < 0 || disk > 999999999999999) {
          return res.send({ status: "disk size" });
        }
        extra.disk = disk;
      }

      if (typeof cpu == "number") {
        if (cpu < 0 || cpu > 999999999999999) {
          return res.send({ status: "cpu size" });
        }
        extra.cpu = cpu;
      }

      if (typeof servers == "number") {
        if (servers < 0 || servers > 999999999999999) {
          return res.send({ status: "server size" });
        }
        extra.servers = servers;
      }

      if (
        extra.ram == 0 &&
        extra.disk == 0 &&
        extra.cpu == 0 &&
        extra.servers == 0
      ) {
        await db.delete("extra-" + req.body.id);
      } else {
        await db.set("extra-" + req.body.id, extra);
      }

      adminjs.suspend(req.body.id);
      return res.send({ status: "success" });
    } else {
      res.send({ status: "missing variables" });
    }
  });

  /**
   * Checks the authorization and returns the settings if authorized.
   * Renders the file based on the theme and sends the response.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   * @returns {Object|null} - The settings object if authorized, otherwise null.
   */
  async function check(req, res) {
    let settings = JSON.parse(fs.readFileSync("./settings.json").toString());
    if (settings.api.client.api.enabled == true) {
      let auth = req.headers["authorization"];
      if (auth) {
        if (auth == "Bearer " + settings.api.client.api.code) {
          return settings;
        }
      }
    }
    let theme = indexjs.get(req);
    ejs.renderFile(
      `./views/${theme.settings.notfound}`,
      await eval(indexjs.renderdataeval),
      null,
      function (err, str) {
        delete req.session.newaccount;
        if (err) {
          console.log(
            `App ― An error has occured on path ${req._parsedUrl.pathname}:`
          );
          console.log(err);
          return res.send(
            "Internal Server Error"
          );
        }
        res.status(200);
        res.send(str);
      }
    );
    return null;
  }
};
