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
			!req.body.userId || 
			!req.body.keyname || 
			typeof req.body.userId !== 'string' || 
			typeof req.body.keyname !== 'string'
		) {
			res.status(400).send('Request body not ok');
			return; 
		}

		const dbName = 'user' + userId;
		const keyname = req.body.keyname; 
		 
		await cloudant.removeKey(dbName, keyname);

	} catch(err) {
		console.log(err);
		res.status(500).send('Server error');
	}
};

