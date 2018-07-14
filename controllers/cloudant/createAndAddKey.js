const httpsReq = require('./httpsReq.js');

module.exports = async (dbHostname, adminUsername, adminPassword, dbName) => {

	const a = await Promise.all([
		createKey(dbHostname, adminUsername, adminPassword), 
		getOldDoc(dbHostname, adminUsername, adminPassword, dbName)
	]); 

	const key = a[0];
	const oldDoc = a[1];

	const newDoc = await createNewDoc(oldDoc, key.keyname);

	const overwrite = await overwriteOldDocWithNewDoc(dbHostname, adminUsername, adminPassword, newDoc, dbName);

	return key; 
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
	// A securityDoc either has no keys or exactly one key named 'cloudant'

	if (Object.keys(oldDoc).length > 1) {
		// oldDoc has more than one key
		throw new Error();
	}

	if (Object.keys(oldDoc).length === 1 && !oldDoc.cloudant) {
		// oldDoc has exactly one key, but it is not named 'cloudant'
		throw new Error();
	}

	const newDoc = {};

	if (!oldDoc.cloudant) {
		// oldDoc is the empty object {} 
		newDoc.cloudant = {
			nobody: []
		};
	} else {
		newDoc.cloudant = oldDoc.cloudant; 
	}

	newDoc.cloudant[keyname] = ['_reader', '_writer'];

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

async function createKey(dbHostname, adminUsername, adminPassword) {

	const init = {
		method: 'POST',
			hostname: dbHostname,
			path: '/_api/v2/api_keys',
			auth: adminUsername + ':' + adminPassword,
			headers: {
				'Accept': 'application/json',
			},
	};

	const getKey = await httpsReq(init);

	if (getKey.statusCode !== 201) {
		const err = new Error();
		err.info = JSON.parse(getKey.body); 
		throw err;
	}

	const key = JSON.parse(getKey.body); 

	return {
		keyname: key.key,
		password: key.password,
	};
}