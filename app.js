// Licensed under the Apache License. See footer for details.
/*jslint node: true*/
"use strict";

var express = require('express');
var cors = require('cors');
var cfenv = require('cfenv');
var favicon = require('serve-favicon');
var app = express();
var bodyParser = require('body-parser')
var compress = require('compression');

var appEnv = cfenv.getAppEnv();

app.use(compress());
app.use(cors());
app.use(bodyParser.urlencoded({
  extended: true
}))

app.use("/api/export", require('./export2office.js'));

// serve the files out of ./public as our main files
app.use(express.static('./public'));
app.use(favicon(__dirname + '/public/icons/favicon.ico'));

// start server on the specified port and binding host
app.listen(appEnv.port, "0.0.0.0", function () {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

// load local VCAP configuration
var vcapLocal = null
try {
  vcapLocal = require("./vcap-local.json");
  console.log("Loaded local VCAP", vcapLocal);
} catch (e) {
  console.error(e);
}
var appEnvOpts = vcapLocal ? {
  vcap: vcapLocal
} : {}
var appEnv = cfenv.getAppEnv(appEnvOpts);
var snapshotDb;
var snapshotDbCredentials = appEnv.services.cloudantNoSQLDB ? appEnv.services.cloudantNoSQLDB[0].credentials : undefined;
if (snapshotDbCredentials) {
  require("./database.js")(snapshotDbCredentials.url, "snapshots", function (err, database) {
    if (err) {
      console.log(err);
    } else {
      snapshotDb = database;
      app.use("/api/updates", require("./updates.js")(snapshotDb));
    }
    scheduleUpdater();
  });
} else {
  console.log("No database configured.");
  scheduleUpdater();
  app.use("/api/updates", require("./updates.js")(undefined));
}

function scheduleUpdater() {
  // schedule future runs
  console.log("Scheduling auto-update");
  var serviceUpdater = require('./retrieve.js')();
  var CronJob = require('cron').CronJob;
  new CronJob({
    // run twice, once at 8 in the US but also at 8 in Europe
    cronTime: '0 0 8,23 * * *',
    onTick: function () {
      console.log(new Date(), "Updating services...");
      serviceUpdater.run(saveSnapshotCallback);
    },
    start: true,
    timeZone: 'America/Los_Angeles'
  });
}

function saveSnapshotCallback(err, resources) {
  if (!err && snapshotDb) {
    var snapshot = {
      type: "snapshot",
      createdAt: new Date(),
      resources: resources
    }
    snapshotDb.insert(snapshot, function (err, body) {
      if (err) {
        console.log("Failed to persist resources snapshot", err);
      } else {
        console.log("Saved resources snapshot.");
      }
    });
  }
}

//------------------------------------------------------------------------------
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------
