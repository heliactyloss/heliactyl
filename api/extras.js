/**
 * |-| [- |_ | /\ ( ~|~ `/ |_
 *
 * Heliactyl 14.11.0 ― Cascade Ridge
 *
 * This is for miscellaneous extra endpoints.
 * @module extras
 */

const settings = require("../settings.json");
const fs = require("fs");
const indexjs = require("../app.js");
const fetch = require("node-fetch");
const Queue = require("../managers/Queue");

module.exports.load = async function (app, db) {
  app.get("/panel", async (req, res) => {
    res.redirect(settings.pterodactyl.domain);
  });

  app.get("/regen", async (req, res) => {
    if (!req.session.pterodactyl) return res.redirect("/login");

    let newsettings = JSON.parse(fs.readFileSync("./settings.json"));

    if (newsettings.api.client.allow.regen !== true)
      return res.send("You cannot regenerate your password currently.");

    let newpassword = makeid(
      newsettings.api.client.passwordgenerator["length"]
    );
    req.session.password = newpassword;

    await fetch(
      settings.pterodactyl.domain +
        "/api/application/users/" +
        req.session.pterodactyl.id,
      {
        method: "patch",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${settings.pterodactyl.key}`,
        },
        body: JSON.stringify({
          username: req.session.pterodactyl.username,
          email: req.session.pterodactyl.email,
          first_name: req.session.pterodactyl.first_name,
          last_name: req.session.pterodactyl.last_name,
          password: newpassword,
        }),
      }
    );

    let theme = indexjs.get(req);
    res.redirect("/security");
  });

  /* Create a Queue */
  const queue = new Queue();

  app.get("/transfercoins", async (req, res) => {
    if (!req.session.pterodactyl) return res.redirect(`/`);

    const coins = parseInt(req.query.coins);
    if (!coins || !req.query.id)
      return res.redirect(`/transfer?err=MISSINGFIELDS`);
    if (req.query.id.includes(`${req.session.userinfo.id}`))
      return res.redirect(`/transfer?err=CANNOTGIFTYOURSELF`);

    if (coins < 1) return res.redirect(`/transfer?err=TOOLOWCOINS`);

    queue.addJob(async (cb) => {
      const usercoins = await db.get(`coins-${req.session.userinfo.id}`);
      const othercoins = await db.get(`coins-${req.query.id}`);
      if (!othercoins) {
        cb();
        return res.redirect(`/transfer?err=USERDOESNTEXIST`);
      }
      if (usercoins < coins) {
        cb();
        return res.redirect(`/transfer?err=CANTAFFORD`);
      }

      await db.set(`coins-${req.query.id}`, othercoins + coins);
      await db.set(`coins-${req.session.userinfo.id}`, usercoins - coins);

      log(
        "Gifted Coins",
        `${req.session.userinfo.username}#${req.session.userinfo.discriminator} sent ${coins}\ coins to the user with the ID \`${req.query.id}\`.`
      );
      cb();
      return res.redirect(`/transfer?err=none`);
    });
  });
};

function makeid(length) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
