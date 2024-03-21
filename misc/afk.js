module.exports = `
// Determine the scheme based on the current protocol
const scheme = document.location.protocol === "https:" ? "wss" : "ws";

// Get the hostname and port from the current URL
const hostname = window.location.hostname;
const port = window.location.port ? ':' + window.location.port : '';

// Establish a ws connection using the current hostname, port, and path
const connection = new WebSocket(\`\${scheme}://\${hostname}\${port}/\${wspath}\`);

let sessionStartTime = new Date();
let sessionDurationElement = document.getElementById("sessionDuration");

// Send a ping msg to the server every 5 seconds once the ws connection is open
connection.onopen = function(evt) {
  setInterval(() => {
    connection.send(JSON.stringify({ type: "ping", }));
  }, 1000);
};

// Redirect to an err page if the ws connection is closed
connection.onclose = function(evt) {
  console.log("Connection closed due to: " + evt.reason);
};

let timer = everywhat;
let hascoin = 0;

// Update timer and coin count every 1s
setInterval(() => {
  timer--;
  if (timer < 1) {
    hascoin += gaincoins;
    document.getElementById("arciogainedcoins").innerHTML = hascoin;
    timer = everywhat;
  }
  document.getElementById("arciotimer").innerHTML = timer;

  // Calculate session duration
  let now = new Date();
  let sessionDuration = Math.floor((now - sessionStartTime) / 1000); // in seconds
  let hours = Math.floor(sessionDuration / 3600);
  let minutes = Math.floor((sessionDuration % 3600) / 60);
  let seconds = sessionDuration % 60;
  let durationString = '';
  if (hours > 0) {
    durationString += hours + " hours, ";
  }
  if (minutes > 0 || hours > 0) {
    durationString += minutes + " minutes";
  } else {
    durationString += seconds + " seconds";
  }
  sessionDurationElement.innerHTML = durationString;
}, 1000);
`;
