const https = require('https');

module.exports = async (init, body) => {

	const req = https.request(init);

	return new Promise( (resolve, reject) => {
		
		req.on('response', (res) => {

			res.on('error', (err) => {
				reject(err); 
			}); 

			let data = ''; 

			res.on('data', (chunk) => {
				data += chunk.toString();
			});

			res.on('end', () => {

				if (data) {
					res.body = data;					
				}

				resolve(res);

			});

		});

		req.on('error', (err) => {
			reject(err);
		});

		if (body) {
			req.write(body);
		}

		req.end();

	});
};
