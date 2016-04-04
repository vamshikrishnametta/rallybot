# rallybot

A Slack bot/slash command to connect Slack with Rally.

Using the Rally API 2.0, this allows you to pull data from Rally as well as update certain data.  As of now, the code has some hard-coded references to Custom Fields in our Rally project, but you could fork this to work for your workspace.

## Setup
- Run `npm install`
- Assuming you're [uploading to Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs#deploy-the-app), you need to set the following config variables:
	- RALLY_WORKSPACE
		- This is the workspace ID of the Rally workspace you're connecting to.
	- RALLY_API_KEY
		- This will be a base API key for all Slack connections to use.
		- Register new keys from [Rally API Key Registry](https://rally1.rallydev.com/login/accounts/index.html#/keys)
	- DOMAIN
		- This is the name of the Slack domain the connections will be coming from
	- BOT_TOKEN
		- This is the token of the Slash Command bot from the Slack setup
- If you want to use Slack to *_update_* Rally, you will also have to setup a Redis and Postgres server on your Heroku instance.  Once that is set up, you'll have the following two config variables automatically set as well:
	- DATABASE_URL
	- REDIS_URL


## Usage
- Use format: `/rally US123 action`
- Possible Actions:
	- status
	- description
	- link
	- notes
	- design
- Add 'p' to the end of a command to post to the channel for others
- To update Rally stories, you must register your API Key using `/rally register`