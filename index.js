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

    var json = {text: 'Test Response', username: 'rallybot', icon_emoji: ':nerd:'};


    if(data.channel_id != null){
        json.channel = data.channel_id; 
    }else if(data.team_id != null){
        json.team = data.team_id; 
    }

  
  // var json = {
  //   text: text,
  //   channel: '#test-int',
  //   username: 'rallybot'
  // };


  // slackhook.send(json, function(err, res){
  //   console.log(err, res);
  // });

  // res.body('Test');

  res.send(json);
});

app.get('/', function(req, res){
  res.send(200);
});

app.listen(process.env.PORT || 3232);
console.log('App listening on port ' + (process.env.port || 3232) );