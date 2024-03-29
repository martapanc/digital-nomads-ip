const { exec } = require("child_process");
const hostile = require("hostile");
const fs = require("fs");

exec("ipconfig getifaddr en0", (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Command stderr: ${stderr}`);
    return;
  }

  const localIpAddress = stdout.trim();
  console.log(`Local IP address (en0): ${localIpAddress}`);

  const webserverLocal = "webserver.local";

  exec(`hostile remove ${webserverLocal}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
      return;
    }

    hostile.set(localIpAddress, webserverLocal, function (err) {
      if (err) {
        console.error(err);
      } else {
        console.log("Set /etc/hosts successfully!");
      }
    });

    const configFile =
      "/Users/mpancaldi/AppetizeWorkspace/appetize-webserver/config.dev.js";

    fs.readFile(configFile, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading JavaScript file:", err);
        return;
      }

      let updatedData = data;

      updatedData = updatedData.replace(
        /(config\s*=\s*{[\s\S]*?baseUrl:\s*')([^']*)(')/,
        (match, p1, p2, p3) => {
          const baseUrl = `http://${localIpAddress}:9080`;
          return p1 + baseUrl + p3;
        }
      );

      updatedData = updatedData.replace(
        /(config\s*=\s*{[\s\S]*?accountsBaseUrl:\s*')([^']*)(')/,
        (match, p1, p2, p3) => {
          const accountsBaseUrl = `http://${localIpAddress}:9082`;
          return p1 + accountsBaseUrl + p3;
        }
      );

      updatedData = updatedData.replace(
        /(config\s*=\s*{[\s\S]*?apiBaseUrl:\s*')([^']*)(')/,
        (match, p1, p2, p3) => {
          const apiBaseUrl = `http://${localIpAddress}:9081`;
          return p1 + apiBaseUrl + p3;
        }
      );

      fs.writeFile(configFile, updatedData, "utf8", (err) => {
        if (err) {
          console.error("Error writing JavaScript file: ", err);
          return;
        }
        console.log("JavaScript file updated successfully.");
      });
    });
  });
});
