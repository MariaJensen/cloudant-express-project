const httpsReq = require('./httpsReq.js');

module.exports = async function(dbHostname, adminUsername, adminPassword, dbName, keyname) {

	const oldDoc = await getOldDoc(dbHostname, adminUsername, adminPassword, dbName);

	const newDoc = await createNewDoc(oldDoc, keyname);

	await overwriteOldDocWithNewDoc(dbHostname, adminUsername, adminPassword, newDoc, dbName);
}

async function overwriteOldDocWithNewDoc(dbHostname, adminUsername, adminPassword, newDoc, dbName) {

	const body = JSON.stringify(newDoc);

	const init = {
		method: 'PUT', 
		hostname: dbHostname,
		path: '/_api/v2/db/' + dbName + '/_security',
		auth: adminUsername + ':' + adminPassword,
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Content-Length': body.length,
		},
	};

	const overwriteDoc = await httpsReq(init, body);

	if (overwriteDoc.statusCode !== 200) {
		const err = new Error();
		err.info = JSON.parse(overwriteDoc.body);
		throw err;
	}
}

async function createNewDoc(oldDoc, keyname) {
	// If oldDoc is not a proper securityDoc, an error will be thrown. 
	// If <keyname> already has no access, a copy of oldDoc will be returned.
	// Otherwise, a new doc will be returned with cloudant[<keyname>] deleted.

	// No warning will occur if keyname already has no access.  

	// A securityDoc either has no keys or exactly one key named 'cloudant'

	if (Object.keys(oldDoc).length === 0) {
		// oldDoc is the empty object, so <keyname> already has no access
		return {};
	}

	if (Object.keys(oldDoc).length > 1) {
		// oldDoc has more than one key and thus is no proper securityDoc
		throw new Error();
	}

	if (Object.keys(oldDoc).length === 1 && !oldDoc.cloudant) {
		// oldDoc has exactly one key, but it is not named 'cloudant'
		// Thus, oldDoc is no proper securityDoc
		throw new Error();
	}

	const newDoc = {};

	newDoc.cloudant = oldDoc.cloudant; 
	delete newDoc.cloudant[keyname];

	return newDoc; 
}

async function getOldDoc(dbHostname, adminUsername, adminPassword, dbName) {

	const init = {
		method: 'GET',
		hostname: dbHostname,
		path: '/_api/v2/db/' + dbName + '/_security',
		auth: adminUsername + ':' + adminPassword,
		headers: {
			'Accept': 'application/json'
		},
	};
	
	const getDoc = await httpsReq(init); 

	if (getDoc.statusCode !== 200) {
		const err = new Error();
		err.info = JSON.parse(getDoc.body);
		throw err; 
	}

	const doc = JSON.parse(getDoc.body); 

	return doc;
}

