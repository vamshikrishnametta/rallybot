var SlackBot = require('slackbots');
 
// create a bot 
var bot = new SlackBot({
    token: process.env.BOT_TOKEN, 
    name: 'Rally Bot'
});
 
bot.on('start', function() {
    // more information about additional params https://api.slack.com/methods/chat.postMessage 
    var params = {
        icon_emoji: ':nerd:'
    };
    
    // define channel, where bot exist. You can adjust it there https://my.slack.com/services  
    //bot.postMessageToChannel('general', 'meow!', params);
    
    // define existing username instead of 'user_name' 
    bot.postMessageToUser('tj.madsen', 'herro!', params); 
    
    // define private group instead of 'private_group', where bot exist 
    //bot.postMessageToGroup('private_group', 'meow!', params); 
});