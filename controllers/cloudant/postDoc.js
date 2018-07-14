const httpsReq = require('./httpsReq.js');

module.exports = async (dbHostname, adminUsername, adminPassword, doc) => {

	const init = {
		method: 'POST',
		hostname: dbHostname,
		path: '/users',
		auth: adminUsername + ':' + adminPassword,
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
	};

	const body = JSON.stringify(doc); 

	const postDoc = await httpsReq(init, body);

	return {
		statusCode: postDoc.statusCode,
		statusMessage: postDoc.statusMessage,
		body: JSON.parse(postDoc.body),
	};

}