const qs = require("querystring");
const axios = require("axios");
const { Base64 } = require("js-base64");
const multipartParse = require("../lib/vendor/multipart-form-parser");
const fs = require('fs');

module.exports = async function (event, tokenUrl) {
	if (event.isBase64Encoded) {
		event.body = Base64.atob(event.body);
	}

	let jsonData = {};
	let formData = {};
	if(event.multiValueHeaders.hasOwnProperty("Content-Type")){
		if (event.multiValueHeaders["Content-Type"][0] === "application/json") {
			// Just return the JSON, it's already an mf2 object
			jsonData = JSON.parse(event.body);
		} else if (event.multiValueHeaders["Content-Type"][0].search("multipart/form-data") > -1){
			formData = multipartParse.readRequestDataInMemory(event);
			jsonData = {
				type: [],
				properties: {}
			};
			// TODO this part should be in implementation side I guess?
			var buf = Buffer.from(formData.files[0].photo, 'latin1');
			/*
			fs.writeFile('image.jpeg', buf, function(err){
				//do nothing
			});
			*/
		} else {
			// form encoded
			formData = qs.parse(event.body);
			// Turn formData into an actual object instead of null
			formData = JSON.parse(JSON.stringify(formData));
			jsonData = {
				type: [],
				properties: {}
			};
		}
	}


	


// Look for query string stuff
	if (event.queryStringParameters.hasOwnProperty("q")) {
		switch (event.queryStringParameters.q) {
			case "config":
				return {
					statusCode: 200,
					body: '',
					query: 'config',
					type: false
				};
			case "source":
				// return properties of source
				return {
					statusCode: 200,
					body: '',
					query: 'source',
					source: event.queryStringParameters.url,
					properties: event.multiValueQueryStringParameters.properties
				};
			case "syndicate-to":
				//return syndication targets
				return {
					statusCode: 200,
					body: '',
					query: 'syndicate-to'
				};
		}
	}


	// Auth
	if (
		!event.headers.hasOwnProperty("authorization") &&
		!formData.hasOwnProperty("access_token")
	) {
		return {
			statusCode: 401,
			body: "No access token provided",
		};
	}
	const token = event.headers.authorization || "Bearer " + data.access_token;
	let res = {};
	try {
		res = await axios.get(tokenUrl, {
			headers: {
				Accept: "application/json",
				Authorization: token,
			},
		});
	} catch {
		return {
			statusCode: 403,
			body: "Bad token",
		};
	}

	if (res.status === 400 || res.status === 401 || res.status === 403) {
		return {
			statusCode: 403,
			body: "Bad token",
		};
	}

	if (event.multiValueHeaders["Content-Type"][0] === "application/json") {
		// Just return the JSON, it's already an mf2 object
		jsonData = JSON.parse(event.body);
	} else {

		let keys = Object.keys(formData);
		keys.forEach(function (key) {
			if (key === "h") {
				jsonData.type = ["h-" + formData[key]];
			} else if (key === "access_token") {
				//Do nothing
			} else if (key === "files") {
				jsonData.files = formData.files;
			} else {
				jsonData.properties[key] = [formData[key]];
			}
		});

		if (jsonData.properties.hasOwnProperty("category[]")) {
			jsonData.properties.category = jsonData.properties["category[]"];
			delete jsonData.properties["category[]"];
		}

	}
	if (!jsonData.hasOwnProperty("type")) {
		// default to h-entry
		jsonData.type = ['h-entry']
	}
	// Authorized, check scopes
	jsonData.scopes = res.data.scope.split(" ");
	jsonData.statusCode = 200;
	jsonData.query = false;
	return jsonData;
};
