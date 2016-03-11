var express = require('express'),
    bodyParser = require('body-parser');
var Slackhook = require('slackhook');
var slackhook = new Slackhook({
    domain: process.env.DOMAIN,
    token: process.env.BOT_TOKEN
}); 
var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.post('/rallybot', function(req, res){
  if( !(req.body && req.body instanceof Object && Object.keys(req.body).length > 0) ) return res.send(403);

  var teamcityText = req.body.build ? req.body.build.text : 'No text from teamcity';
  var buildStatus = req.body.build ? req.body.build.buildStatus : 'No build status';
  var buildLink = req.body.build ? req.body.build.buildStatusUrl : 'No build link';

  var text = teamcityText;
  text += '\nStatus: ' + buildStatus;
  text += '\n<' + buildLink + '|Build>';

  var json = {text: 'Hi ' + hook.user_name, username: 'rallybot', icon_emoji: ':nerd:'};
  // var json = {
  //   text: text,
  //   channel: '#test-int',
  //   username: 'rallybot'
  // };


  slackhook.send(json, function(err, res){
    console.log(err, res);
  });
  // res.body('Test');

  res.send(200);
});

app.get('/', function(req, res){
  res.send(200);
});

app.listen(process.env.PORT || 3232);
console.log('App listening on port ' + (process.env.port || 3232) );