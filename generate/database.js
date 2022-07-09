var async = require("async");

async function Database(databaseUrl, dbName) {
  var self = this;

  self.addSnapshot = async function(resources) {
    var snapshot = {
      type: "snapshot",
      createdAt: new Date(),
      resources: resources
    }
    return new Promise((resolve, reject) => {
      console.log(`Saving resources snapshot (${snapshot.createdAt})...`);
      self.db.insert(snapshot, function (err, body) {
        if (err) {
          console.error("Failed to save snapshot", err);
          reject(err);
        } else {
          console.log("Saved resources snapshot.");
          resolve({ok : true});
        }
      });
    });
  };

  self.getRecentSnapshots = async function() {
    return new Promise((resolve, reject) => {
      self.db.view("snapshots", "by_date", {
        descending: true,
        limit: 5,
        include_docs: true
      }, function (err, body) {
        if (err) {
          console.error("Failed to retrieve snapshots", err);
          reject(err);
        } else {
          resolve(body.rows.map(function (row) {
            return row.doc;
          }));
        }
      });
    });
  };

  return new Promise((resolve, reject) => {
    console.log("Initializing database...");

    var cloudant = require('nano')(databaseUrl).db;
    var db;
    var prepareDbTasks = [];

    // create the db
    prepareDbTasks.push(
      function (callback) {
        console.log("Creating database...");
        cloudant.create(dbName, function (err, body) {
          if (err && err.statusCode == 412) {
            console.log("Database already exists");
            callback(null);
          } else if (err) {
            callback(err);
          } else {
            callback(null);
          }
        });
      });

    // use it
    prepareDbTasks.push(
      function (callback) {
        console.log("Setting current database to", dbName);
        db = cloudant.use(dbName);
        callback(null);
      });

    async.waterfall(prepareDbTasks, function (err, result) {
      if (err) {
        console.log("Error in database preparation", err);
        reject(err);
      } else {
        self.db = db;
        resolve(self);
      }
    });
  });
}

module.exports = Database;
