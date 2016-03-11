var server = restify.createServer();

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.gzipResponse());
server.use(restify.bodyParser({ mapParams: false }));

server.post('/rallybot', MESSAGE);
server.listen(process.env.PORT || 4444);

function rallybot(req, res, next)
{
    if (process.env.BOT_TOKEN == req.body.token)
    {
        next(new restify.ForbiddenError('Bad!'));
    }

    var message = 'Hi '+req.body.user_name ;

    //{text: 'Hi ' + hook.user_name, username: 'rallybot', icon_emoji: ':nerd:'}
    
    res.json(200, { text: message, channel: REQUEST.body.channel_name});
    
    next();
}

// app.post('/rallybot', function(req, res){
//     var hook = slack.respond(req.body);
//     res.json({text: 'Hi ' + hook.user_name, username: 'rallybot', icon_emoji: ':nerd:'});
// });


// var express = require('express');
// var Slackhook = require('slackhook');
// var slackhook = new Slackhook({
//     domain: process.env.DOMAIN,
//     token: process.env.BOT_TOKEN
// }); 
// var app = express();

// app.use(express.urlencoded());
// app.use(express.json());

// app.post('/rallybot', function(req, res){
//   if( !(req.body && req.body instanceof Object && Object.keys(req.body).length > 0) ) return res.send(403);

//   var teamcityText = req.body.build ? req.body.build.text : 'No text from teamcity';
//   var buildStatus = req.body.build ? req.body.build.buildStatus : 'No build status';
//   var buildLink = req.body.build ? req.body.build.buildStatusUrl : 'No build link';

//   var text = teamcityText;
//   text += '\nStatus: ' + buildStatus;
//   text += '\n<' + buildLink + '|Build>';

//   // var json = {text: 'Hi ' + hook.user_name, username: 'rallybot', icon_emoji: ':nerd:'};
//   var json = {
//     text: text,
//     channel: '#test-int',
//     username: 'rallybot'
//   };


//   slackhook.send(json, function(err, res){
//     console.log(err, res);
//   });

//   res.send(200);
// });

// app.get('/', function(req, res){
//   res.send(200);
// });

// app.listen(process.env.PORT || 3232);
// console.log('App listening on port ' + (process.env.port || 3232) );