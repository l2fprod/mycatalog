var async = require("async");

function Database(databaseUrl, dbName, waterfallCallback) {
  var self = this;

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
    }

    waterfallCallback(err, db);
  });

}

// callback(err, database)
module.exports = function (databaseUrl, dbName, waterfallCallback) {
  return new Database(databaseUrl, dbName, waterfallCallback);
}