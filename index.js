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

bot.on('message', function(data) {
    
    console.log(data);

    var params = {
        icon_emoji: ':nerd:'
    };
    bot.postMessageToChannel('test-int', 'meow!', params);
    // all ingoing events https://api.slack.com/rtm 
    if(data.channel_id != null){
        
        // bot.postMessageToChannel('data.channel_name', 'meow!', params);
        // bot.postMessage(data.channel_id, 'hellooo!', params); 
    }else if(data.team_id != null){
        // bot.postMessage(data.team_id, 'hellooo!', params); 
    }else if(data.user_id != null){
        // bot.postMessage(data.user_id, 'hellooo!', params); 
    }
    

});