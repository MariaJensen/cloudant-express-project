const httpsReq = require('./httpsReq.js');

module.exports = async (dbHostname, adminUsername, adminPassword, dbName) => {

	const init = {
		method: 'PUT',
		hostname: dbHostname,
		path: '/' + dbName,
		auth: adminUsername + ':' + adminPassword,
		headers: {
			'Accept': 'application/json',
		},
	};

	const putDb = await httpsReq(init);

	return {
		statusCode: putDb.statusCode,
		statusMessage: putDb.statusMessage,
		body: JSON.parse(putDb.body),
	};

}