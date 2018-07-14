const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');

const validatePassword = require('./validatePassword.js');
const redis = require('./redis.js');
// const cloudant = require('./cloudant.js');

const dbHostname = process.env.DB_HOSTNAME;
const adminUsername = process.env.DB_ADMIN_USERNAME;
const adminPassword = process.env.DB_ADMIN_PASSWORD;

const login = async (req, res, next) => {

	try {

		// Validate request body: 

			if( !(typeof req.body === 'object') || Object.keys(req.body).length !== 2 || !req.body.username || !req.body.password || typeof req.body.username !== 'string' || typeof req.body.password !== 'string' || !validatePassword(req.body.password) ) 
			{
				res.status(400).end();
				return;
			}
			console.log('Validated');

		// Retrieve user's doc from db 'users': 

			const getUserDoc = await cloudant.dbReq({
				method: 'POST', 
				hostname: dbHostname,
				path: '/users/_find',
				auth: adminUsername + ':' + adminPassword,
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				}
			}, JSON.stringify({
				selector: {
					'username': req.body.username
				},
				limit: 1
			}));

			if(!JSON.parse(getUserDoc.body).docs.length) {
				// No document in db 'users' has 'username': req.body.username
				res.status(404).end();
				return;
			}

			const userDoc = JSON.parse(getUserDoc.body).docs[0];

			if (!userDoc.hash || !userDoc._id) {
				res.status(500).end();
				return;
			}
			console.log('userDoc retrieved');

		// Make sure that the db 'user' + <userId> exists:

			const getUserDb = await cloudant.dbReq({
				method: 'GET',
				hostname: dbHostname,
				path: '/user' + userDoc._id,
				auth: adminUsername + ':' + adminPassword,
				headers: {
					'Accept': 'application/json'
				}
			}); 

			if (getUserDb.statusCode !== 200) {
				res.status(404).end();
				return;
			}
			console.log('userDb exists');

		// Validate password against hash:

			const passwordValidated = await bcrypt.compare(req.body.password, userDoc.hash);

			if (!passwordValidated) {
				res.status(404).end();
				return;
			}
			console.log('password validated');

		// Retrieve an api key with reading and writing access to db 'user' + <userId>: 

			const key = await cloudant.createAndAddKey(dbHostname, adminUsername, adminPassword, 'user' + userDoc._id);
			
			console.log('api key retrieved');

		// Create a sessionId:

			let sessionId = uuidv4();
			console.log('sessionId created');

		// Does redis already have a key named 'session:' + <sessionId>? 

			let sessionIdUnavailable = await redis.findOne('session:' + sessionId);
			
			while (sessionIdUnavailable) {
				sessionId = uuidv4();
				sessionIdUnavailable = await redis.findOne('session:' + sessionId);
			}
			console.log('sessionId unique');

		// Create redis hash 'session: + <sessionId> 

			const createRedisHash = await redis.HMSET('session:' + sessionId, {
				dbHostname: dbHostname,
				userId: userDoc._id,
				username: req.body.username,
				dbKeyname: key.keyname
			});

			console.log(createRedisHash);

			const getRedisHash = await redis.HGETALL('session:' + sessionId);
			console.log(getRedisHash);

		// Set a cookie on the client containing the sessionId

			res.cookie('session', sessionId, {
				httpOnly: true
			}).json({
				dbHostname: dbHostname,
				keyname: key.keyname,
				keypass: key.keypass
			});

	} catch(err) {
		// TODO: clean up
		res.status(500).end();
	}
}

module.exports = login;



