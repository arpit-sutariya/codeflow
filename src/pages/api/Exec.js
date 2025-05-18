const https = require("https");

function Exec(input, language, code, callback) {
  // Prepare the request data
  const requestData = JSON.stringify({ input, language, code });
  // Set up the request options
  const options = {
    hostname: "exec-execution-dev.koyeb.app",
    port: 443,
    path: "/run",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": requestData.length,
    },
  };

  // Make a POST request to the other server
  const request = https.request(options, (response) => {
    let data = "";

    // Concatenate data chunks
    response.on("data", (chunk) => {
      data += chunk;
    });

    // Once all data is received, call the callback with the data
    response.on("end", () => {
      callback(null, data);
    });
  });

  // Handle errors
  request.on("error", (error) => {
    callback(error, null);
  });

  // Send the request data
  request.write(requestData);
  request.end();
}

module.exports = Exec;
