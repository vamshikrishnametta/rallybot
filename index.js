var express = require('express'),
    bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.post('/rallyslash', function(req, res){
  if( !(req.body && req.body instanceof Object && Object.keys(req.body).length > 0) ) return res.send(403);

    var text

    if(req.body.token == process.env.BOT_TOKEN){
        var message = '';
        var text = req.body.text;
        var tokens = text.split(" ");
        if(tokens[0] == 'help'){
            message = 'Use format: /rally US123 action\n\n Possible Actions: \n status \n description \n link \n notes';
        }else if(tokens[0].substr(0,2) == 'US'){
            


        }else(){
            message = 'Use format: /rally US123 action'
        }


        var json = {text: message, username: 'rallybot', icon_emoji: ':nerd:'};
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