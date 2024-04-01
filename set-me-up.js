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

    const configFile = process.env.CONFIG_FILE_PATH;

    if (!configFile) {
        console.error("Error reading the Config file");
        return;
    }

    fs.readFile(configFile, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading JavaScript file:", err);
        return;
      }

      let updatedData = data;

      updatedData = updateUrlField('baseUrl', 9080, updatedData, localIpAddress);
      updatedData = updateUrlField('accountsBaseUrl', 9082, updatedData, localIpAddress);
      updatedData = updateUrlField('apiBaseUrl', 9081, updatedData, localIpAddress);

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

function updateUrlField(key, port, updatedData, localIpAddress) {
    const regex = new RegExp(`(config\\s*=\\s*{[\\s\\S]*?${key}:\\s*')([^']*)(')`);
    
    updatedData = updatedData.replace(
        regex,
        (match, p1, p2, p3) => {
            const baseUrl = `http://${localIpAddress}:${port}`;
            return p1 + baseUrl + p3;
        }
    );
    return updatedData;
}

