const bcrypt = require('bcrypt');
const uuidv4 = require('uuid/v4');

const Cloudant = require('./cloudant/');

const dbHostname = process.env.DB_HOSTNAME;
const adminUsername = process.env.DB_ADMIN_USERNAME;
const adminPassword = process.env.DB_ADMIN_PASSWORD;

const cloudant = new Cloudant(dbHostname, adminUsername, adminPassword);

const passwordScheme = [
	[/[#\$%&\*<>=?@\[\]\^~\{\}]/g, 3],
	[/[0-9]/g, 3],
	[/[a-z]/g, 3],
	[/[A-Z]/g, 3]
];
	/**	
		* at least 3 capital letters (A-Z)
		* at least 3 small letters (a-z)
		* at leeast 3 digits (0-9)
		* at least 3 of the special characters: 
			# , $ , % , & , * , < , > , = , ? , @ , [ , ] , ^ , ~ , { , }
	*/

module.exports = async function (req, res) {

	try{

		const bodyOk = validateBody(req.body); 

		if (!bodyOk) {
			res.status(400).send('Request body not ok');
			return; 
		}

		const username = req.body.username; 
		const password = req.body.password; 

		const passwordOk = validatePassword(password, passwordScheme);

		if (!passwordOk) {
			res.status(400).send('Password not ok');
			return; 
		} 

		const usernameOk = await usernameAvailable(username); 

		if (!usernameOk) {
			res.status(403).send('Username unavailable');
			return; 
		}

		const createIdAndHash = await Promise.all([
			createAvailableId(),
			createPasswordHash(password, 12)
		]);

		const id = createIdAndHash[0];
		const hash = createIdAndHash[1];

		const createUserDbAndUserDoc = await Promise.all([
			createUserDb(id),
			createUserDoc(id, username, hash)
		]);

		// respond with success
		res.status(201).send('User registered');

	} catch(err) {
		// TODO: clean up according to content of error
		res.status(500).send('Server error');
	} 
}

async function createUserDoc(id, username, hash) {
	
	const postDoc = await cloudant.postDoc({
		_id: id,
		username: username,
		hash: hash,
	});

	if (postDoc.statusCode !== 201) {
		throw postDoc;
	}
}

async function createUserDb(id) {
	
	const putDb = await cloudant.putDb('user' + id); 
	
	if (putDb.statusCode !== 201) {
		throw putDb; 
	}
}

async function createPasswordHash(password, rounds) {
	const salt = await bcrypt.genSalt(rounds);
	const hash = await bcrypt.hash(password, salt);
	return hash;
}

async function createAvailableId() {

	let id; 
	let idAvailable;	
	let done; 

	do {

		id = uuidv4();	

		let idAvailable = await Promise.all([
			userIdAvailable(id), 
			dbNameAvailable('user' + id)
		]);

		done = (idAvailable[0] && idAvailable[1]);

	} while (!done)

	return id; 
}

async function dbNameAvailable(dbName) {
	// dbName must be a string
	// The function will return false exactly if cloudant has a db named <dbName>

	const getDb = await cloudant.getDb(dbName);
	
	if (getDb.statusCode === 404 && getDb.body.reason === 'Database does not exist.') {
		return true; 
	}

	return false;
}

async function userIdAvailable(id) {
	// id must be a string
	// The function will return false exactly if cloudant db 'users' has a doc containing 
	// the property 
	// 		_id: <id>

	const query = await cloudant.queryDb('users', {_id: id}, 1);
	
	if (query.statusCode !== 200) {
		throw query;
	}

	if (query.body.docs.length === 1) {
		return false; 
	}

	return true;
}

async function usernameAvailable(username) {

	// <username> must be a string
	// The function will return false exactly if cloudant db 'users' has a doc containing 
	// the property 
	// 		username: <username>

	const query = await cloudant.queryDb('users', {username: username}, 1);

	if (query.statusCode !== 200 ) {
		throw query;	
	}

	if (query.body.docs.length === 1) {
		return false;
	}

	return true;
}

function validatePassword(password, passwordScheme) {

	/**	<passwordScheme> must be an array of rules. 
		Each rule must be an array containing a regExp and a number.
		<password> must be a string. 
		Function will return true exactly when for each rule password contains at least <number> of matches to <regExp>
	*/
	return passwordScheme.map( rule => {
		
		if (rule[1] < 1) {
			return true;
		}

		const matches = rule[0][Symbol.match](password); 
			// if no match for regExp <rule[0]> is found in password, <matches> will be <null>. Else it will be an array of the matching characters. 

		return (matches && matches.length >= rule[1]);
		
	}).every(elem => elem);	
} 

function validateBody(body) {

	if ( !(typeof body === 'object') || Object.keys(body).length !== 2 || !body.username || !body.password || typeof body.username !== 'string' || typeof body.password !== 'string') {
		return false;
	}

	return true;
}

