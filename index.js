var Slackhook = require('slackhook');
var slack = new Slackhook({
    domain: process.env.DOMAIN,
    token: process.env.BOT_TOKEN
}); 


app.post('/rallybot', function(req, res){
    var hook = slack.respond(req.body);
    res.json({text: 'Hi ' + hook.user_name, username: 'rallybot', icon_emoji: ':nerd:'});
});
