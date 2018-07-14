const httpsReq = require('./httpsReq.js');

module.exports = async (dbHostname, adminUsername, adminPassword, dbName) => {

	const init = {
		method: 'GET',
		hostname: dbHostname,
		path: '/' + dbName,
		auth: adminUsername + ':' + adminPassword,
		headers: {
			'Accept': 'application/json',
		},
	};

	const query = await httpsReq(init);

	return {
		statusCode: query.statusCode,
		statusMessage: query.statusMessage,
		body: JSON.parse(query.body),
	};

}