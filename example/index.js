const { Moodle } = require("moodle-scrape");
const undici = require("undici");
 
const url = ""; // https://example.com
const username = "";
const password = "";

const moodle = new Moodle(undici.fetch, url);

async function init() {
	console.time('-- login() time')
	const success = await moodle.login(username, password, false);
	console.timeEnd('-- login() time')

	if(!success) {
		return console.log("ERROR: Login failed.");
	}

	console.time('-- getInfo() time')
	await moodle.refresh();
	console.timeEnd('-- getInfo() time')

	console.log(moodle.user);
    console.log(moodle.courses);
	console.log(moodle.tasks);
}

init();