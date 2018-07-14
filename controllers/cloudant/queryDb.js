const httpsReq = require('./httpsReq.js');

module.exports = async (dbHostname, adminUsername, adminPassword, dbName, selector, limit) => {

	// limit is optional

	const init = {
		method: 'POST',
		hostname: dbHostname,
		path: '/' + dbName + '/_find',
		auth: adminUsername + ':' + adminPassword,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		}
	};

	const body = JSON.stringify({
		selector: selector,
		limit: limit,
	});
		// JSON.stringify will ignore a property if its value is undefined

	const query = await httpsReq(init, body);

	return {
		statusCode: query.statusCode,
		statusMessage: query.statusMessage,
		body: JSON.parse(query.body),
	};

}