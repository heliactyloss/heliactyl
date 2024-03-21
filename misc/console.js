const chalk = require("chalk");

function timestamp() {
  const now = new Date();
  return `${now.toLocaleString()}`;
}

function logWithInfo() {
  const originalLog = console.log;
  console.log = function () {
    const stack = new Error().stack.split("\n");
    // stack[2] will contain caller file path and line number
    const filePath = stack[2].trim().replace(__dirname + "/", "");
    const prefix = `${chalk.bgGray(" " + timestamp() + " ")}`;
    // this was here: ${chalk.bgBlue(' ' + (filePath.replace('at Server.<anonymous> (/home/container/', '')).replace(')', '') + ' ')}
    // whoever wrote this back at kaveri is fucking retarded...
    // edit 01/24: this is still a pile of shit. why are we adding the date and time to every log, it fucks half of them up -atqr
    const args = Array.from(arguments);
    args.unshift(prefix);
    originalLog.apply(
      console,
      args.map((arg) => chalk.gray(arg))
    );
  };
}

module.exports = logWithInfo;
