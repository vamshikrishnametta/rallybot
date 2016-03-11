var express = require('express'),
    bodyParser = require('body-parser');
var rally = require('rally');
var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var restApi = rally({
       apiKey: process.env.RALLY_API_KEY, //preferred, required if no user/pass, defaults to process.env.RALLY_API_KEY
       apiVersion: 'v2.0', //this is the default and may be omitted
       requestOptions: {
           headers: {
               'X-RallyIntegrationName': 'slack integration',  //while optional, it is good practice to
               'X-RallyIntegrationVendor': 'tj madsen',             //provide this header information
               'X-RallyIntegrationVersion': '1.0'                    
           }
           //any additional request options (proxy options, timeouts, etc.)     
       }
   });


app.post('/rallyslash', function(req, res){
  if( !(req.body && req.body instanceof Object && Object.keys(req.body).length > 0) ) return res.send(403);

    var text

    if(req.body.token == process.env.BOT_TOKEN){
        var message = '';
        var json = json = {text: message, username: 'rallybot', icon_emoji: ':nerd:'};
        var text = req.body.text;
        var tokens = text.split(" ");
        if(tokens[0] == 'help'){
            json.message = 'Use format: /rally US123 action\n\n Possible Actions: \n status \n description \n link \n notes';
            res.send(json);
        }else if((tokens[0].substr(0,2) == 'US' || tokens[0].substr(0,2) == 'DE') && !isNaN(tokens[0].substring(1,tokens[0].lenth - 1))){
            // json.message = '<https://rally1.rallydev.com/#/'+process.env.RALLY_WORKSPACE+'/search?keywords='+token[0]+'>';
            // res.send(json);
            json.message = 'US-'+tokens[0].substring(1,tokens[0].lenth - 1);
            res.send(json);
            restApi.get({
                ref: 'userstory/'+tokens[0], //may be a ref ('/defect/1234') or an object with a _ref property
                fetch: ['FormattedID', 'Name', 'Description'], //fields to fetch
                // scope: {
                    // workspace: '/workspace/12345' //optional, only required if reading in non-default workspace
                // },
                requestOptions: {} //optional additional options to pass through to request
            }).then(function(result) {
                console.log(result.Object);
                if(token[1] == 'description'){
                    // json.message = result.Object.Description;
                    json.message = token[0]+' Description';
                }else{
                    json.message = '<https://rally1.rallydev.com/#/'+process.env.RALLY_WORKSPACE+'/search?keywords='+token[0]+'>';
                }
                
                res.send(json);
            }).fail(function(errors) {
                console.log(errors);
            });

        }else{
            json.message = 'Use format: /rally US123 action'
            res.send(json);
        }


        // var json = {text: message, username: 'rallybot', icon_emoji: ':nerd:'};
        // if(req.body.channel_id != null && req.body.channel_name != 'directmessage'){
        //     json.channel_id = req.body.channel_id; 
        // }
        // res.send(json);
    }else{
        res.send('Bad!')
    }
});

app.get('/', function(req, res){
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3232);
console.log('App listening on port ' + (process.env.port || 3232) );