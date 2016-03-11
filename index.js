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

    var text

    if(req.body.token == process.env.BOT_TOKEN){
        var json = {text: JSON.stringify(req.body), username: 'rallybot', icon_emoji: ':nerd:'};
        if(req.body.channel_id != null && req.body.channel_name != 'directmessage'){
            json.channel_id = req.body.channel_id; 
        }
        res.send(json);
    }else{
        res.send('Bad!')
    }
});

app.get('/', function(req, res){
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3232);
console.log('App listening on port ' + (process.env.port || 3232) );