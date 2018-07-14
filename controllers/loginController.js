const bcrypt = require('bcrypt');

const Cloudant = require('./cloudant/');

const dbHostname = process.env.DB_HOSTNAME;
const adminUsername = process.env.DB_ADMIN_USERNAME;
const adminPassword = process.env.DB_ADMIN_PASSWORD;

const cloudant = new Cloudant(dbHostname, adminUsername, adminPassword);

module.exports = async function (req, res) {
	
	try {

		if ( 
			!req.body || 
			!(typeof req.body === 'object') || 
			Object.keys(req.body).length !== 2 || 
			!req.body.username || 
			!req.body.password || 
			typeof req.body.username !== 'string' || 
			typeof req.body.password !== 'string'
		) {
			res.status(400).send('Request body not ok');
			return; 
		}

		const username = req.body.username; 
		const password = req.body.password;

		const userDoc = await getUserDoc(username); 

		if (!userDoc) {
			console.log('Username was not found');
			res.status(404).send();
			return;
		}

		const userId = userDoc.userId; 
		const hash = userDoc.hash; 
		const userDb = 'user' + userId;

		const a = await Promise.all([
			cloudant.getDb(userDb),
			bcrypt.compare(password, hash)
		]); 

		const getUserDb = a[0];
		const passwordOk = a[1];

		if (getUserDb.statusCode !== 200) {
			// userDb was not found
			console.log('User is not registered properly');
			res.status(404).send();
			return;
		}

		if (!passwordOk) {
			console.log('Password does not match');
			res.status(404).send();
			return; 
		}

		const key = await cloudant.createAndAddKey(userDb);

		res.status(200).json({
			userId: userId,
			key: key,
		});

	} catch(err) {
		console.log(err);
		// TODO: clean up according to content of error
		res.status(500).send('Server error');
	}
}

async function getUserDoc(username) {

	// Returns undefined if no doc in db 'users' has property 
	// 		username: <username>
	// or if such a doc exists but does not contain keys _id and hash. 
	// Else returns an object with keys userId and hash. 

	const query = await cloudant.queryDb('users', {username: username}, 1);

	if (query.statusCode !== 200) {
		// query failed
		const err = new Error();
		err.info = query;
		throw err; 
	}

	const docs = query.body.docs; 

	if (docs.length === 0 ) {
		// UserDoc not found
		return; // returns undefined
	}

	if (!docs[0]._id || !docs[0].hash) {
		// userDoc found but not proper
		return; // returns undefined
	}
	
	return {
		userId: docs[0]._id,
		hash: docs[0].hash
	};
}

