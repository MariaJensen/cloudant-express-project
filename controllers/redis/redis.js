const redis = require('redis');

// Assuming redis is running on localhost, default port. 

exports.HMSET = async (key, value) => {
	// Parameters: 
	// 		key: string
	// 		value: an object in which all the values are of type string
	// Resolves with the string 'OK', or rejects with an error. 

	return new Promise( (resolve, reject) => {

		const client = redis.createClient();

		client.on('error', (err) => {
			reject(err);
			client.quit();
		});

		client.hmset(key, value, (err, res) => {
			
			if (err) {
				reject(err);
				client.quit();
			}

			resolve(res);
			client.quit();

		});
	});
};

exports.HGETALL = async (key) => {
	// Parameters: 
	// 		key: string
	// Resolves with 
	//		an object containing the field-value pairs of the hash named <key>, 
	// 			if such a hash exists
	// 		null, 
	// 			if such a hash does not exist
	// or rejects with an error. 

	return new Promise( (resolve, reject) => {

		const client = redis.createClient();

		client.on('error', (err) => {
			reject(err);
			client.quit();
		});

		client.hgetall(key, (err, res) => {
			
			if (err) {
				reject(err);
				client.quit();
			}

			resolve(res);
			client.quit();

		});
	});
};

exports.EXISTS = async(key) => {
	// Parameters: 
	// 		key: string
	// Resolves with
	//		1 if any key (of any type) exists with the name <key>
	// 		0 if no key exists with the name <key>
	// or rejects with an error. 

	return new Promise( (resolve, reject) => {

		const client = redis.createClient();

		client.on('error', (err) => {
			reject(err);
			client.quit();
		});

		client.exists(key, (err, res) => {
			
			if (err) {
				reject(err);
				client.quit();
			}

			resolve(res);
			client.quit();

		});
	});
};

// Supported glob-style patterns:

	//     h?llo matches hello, hallo and hxllo
	//     h*llo matches hllo and heeeello
	//     h[ae]llo matches hello and hallo, but not hillo
	//     h[^e]llo matches hallo, hbllo, ... but not hello
	//     h[a-b]llo matches hallo and hbllo

	// Use \ to escape special characters if you want to match them verbatim.

exports.SCAN = async(cursor, obj) => {
	// Parameters: 
	// 		cursor: number
	// 		obj: an object with properties match: pattern and/or count: number 
	// 			or the empty object 
	// Resolves with a list of two elements: 
	// 		a string containing a number (new cursor)
	//		a list of length max obj.count keys satisfying obj.pattern
	// or rejects with an error. 

	return new Promise( (resolve, reject) => {

		const client = redis.createClient();

		client.on('error', (err) => {
			reject(err);
			client.quit();
		});

		if (obj.match && obj.count) {
			client.scan(cursor, 'MATCH', obj.match, 'COUNT', obj.count, (err, res) => {
				if (err) {
					reject(err);
					client.quit();
				}

				resolve(res);
				client.quit();
			});
		}

		if (obj.match ) {
			client.scan(cursor, 'MATCH', obj.match, (err, res) => {
				if (err) {
					reject(err);
					client.quit();
				}

				resolve(res);
				client.quit();
			});
		}

		if (obj.count) {
			client.scan(cursor, 'COUNT', obj.count, (err, res) => {
				if (err) {
					reject(err);
					client.quit();
				}

				resolve(res);
				client.quit();
			});
		}

	});
};

exports.findAll = async (match) => {

	const obj = {
		match: match
	};

	let scan = await this.SCAN(0, obj); 

	let arr = scan[1];

	while (scan[0] !== '0') {
		scan = await this.SCAN(scan[0], obj);
		arr = arr.concat(scan[1]);
	}

	return arr; 
};

exports.findOne = async (match) => {
	
	const obj = {
		match: match
	};

	let scan = await exports.SCAN(0, obj); 

	while (scan[0] !== '0' && !scan[1].length) {
		scan = await exports.SCAN(scan[0], obj);
	}

	return scan[1][0];

}


