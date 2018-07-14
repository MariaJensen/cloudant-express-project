const queryDb = require('./queryDb.js');
const getDb = require('./getDb.js');
const putDb = require('./putDb.js');
const postDoc = require('./postDoc.js');
const createAndAddKey = require('./createAndAddKey.js');
const removeKey = require('./removeKey.js');

module.exports = function(dbHostname, adminUsername, adminPassword) {
	this.queryDb = (dbName, selector, limit) => queryDb(dbHostname, adminUsername, adminPassword, dbName, selector, limit);

	this.getDb = (dbName) => getDb(dbHostname, adminUsername, adminPassword, dbName);

	this.putDb = (dbName) => putDb(dbHostname, adminUsername, adminPassword, dbName);

	this.postDoc = (doc) => postDoc(dbHostname, adminUsername, adminPassword, doc);

	this.createAndAddKey = (dbName) => createAndAddKey(dbHostname, adminUsername, adminPassword, dbName);

	this.removeKey = (dbName, keyname) => removeKey(dbHostname, adminUsername, adminPassword, dbName, keyname);
	
}