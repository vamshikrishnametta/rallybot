var express = require('express'),
    bodyParser = require('body-parser');
var rally = require('rally'),
    queryUtils = rally.util.query;
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var restApi = rally({
       // apiKey: process.env.RALLY_API_KEY, //preferred, required if no user/pass, defaults to process.env.RALLY_API_KEY
       apiVersion: 'v2.0', //this is the default and may be omitted
       server: 'https://rally1.rallydev.com',
       requestOptions: {
           headers: {
               'X-RallyIntegrationName': 'slack integration',  //while optional, it is good practice to
               'X-RallyIntegrationVendor': 'tj madsen',             //provide this header information
               'X-RallyIntegrationVersion': '1.0'                    
           }
           //any additional request options (proxy options, timeouts, etc.)     
       }
   });

var removeHTML = function(inText){
  var outText = inText;
  outText = outText.replace(/<div\s*.*?>/g, '\n');
  outText = outText.replace(/<\/div>/g, '');
  outText = outText.replace(/&nbsp;/g, ' ');
  outText = outText.replace(/<b\s*.*?>/g, '*');
  outText = outText.replace(/<\/b>/g, '*');
  outText = outText.replace(/<i\s*.*?>/g, '_');
  outText = outText.replace(/<\/i>/g, '_');
  outText = outText.replace(/<br \/>/g, '\n');
  outText = outText.replace(/<ol>/g, '');
  outText = outText.replace(/<\/ol>/g, '');
  outText = outText.replace(/<ul\s*.*?>/g, '');
  outText = outText.replace(/<\/ul>/g, '');
  outText = outText.replace(/<li\s*.*?>/g, '\n-');
  outText = outText.replace(/<\/li>/g, '');
  outText = outText.replace(/<font\s*.*?>/g, '');
  outText = outText.replace(/<\/font>/g, '');
  outText = outText.replace(/<span\s*.*?>/g, '');
  outText = outText.replace(/<\/span>/g, '');
  return outText;
}


app.post('/rallyslash', function(req, res){
  if( !(req.body && req.body instanceof Object && Object.keys(req.body).length > 0) ) return res.send(403);

    //

    if(req.body.token == process.env.BOT_TOKEN){
        var message = ' ';
        var json = json = {text: message, username: 'rallybot', icon_emoji: ':nerd:'};
        var text = req.body.text;
        console.log(req.body);
        var tokens = text.split(" ");
        var type = tokens[0].substr(0,2).toUpperCase();
        var number = tokens[0].substring(2,tokens[0].length);
        if(tokens[0] == 'help'){
            json.message = 'Use format: /rally US123 action\n\n Possible Actions: \n status \n description \n link \n notes';
            res.send(json);
        }else if((type == 'US' || type == 'DE') && !isNaN(number)){
            var rallyReqBody = {
                type: 'hierarchicalrequirement',
                query: queryUtils.where('FormattedID', '=', tokens[0]),
                fetch: ['FormattedID', 'Name', 'Description', 'Notes', 'CommExOwner', 'UserStoryStatus', 'CommexITOwner', 'AssignedArchitect', 'DesignState', 'Blocked', 'BlockedReason', 'ScheduleState', 'Itertion', 'Release', 'DeveloperAssigned1', 'SystemDesignSuggestions' ], //fields to fetch
                limit: Infinity,
                order: 'Rank',
                requestOptions: {} //optional additional options to pass through to request
            };

            if(type == 'DE'){
              rallyReqBody.type = 'defect';
            }

            // console.log(rallyReqBody);
            restApi.query(rallyReqBody).then(function(result) {
                //console.log(result);
                // console.log(result.Results);
                if(tokens[1] == 'description' || tokens[1] == 'd'){
                    // json.message = result.Object.Description;
                    json.text = '*'+tokens[0]+' - '+result.Results[0].Name+':* \n>>>'+removeHTML(result.Results[0].Description);

                }else if(tokens[1] == 'notes' || tokens[1] == 'n'){
                    // json.message = result.Object.Description;
                    json.text = '*'+tokens[0]+' - '+result.Results[0].Name+':* \n_Notes_\n>>>'+removeHTML(result.Results[0].Notes);

                }else if(tokens[1] == 'design' || tokens[1] == 'sds'){
                    // json.message = result.Object.Description;
                    json.text = '*'+tokens[0]+' - '+result.Results[0].Name+':* \n_Design_\n>>>'+removeHTML(result.Results[0].c_SystemDesignSuggestions);

                }else if(tokens[1] == 'status' || tokens[1] == 's'){
                    // json.message = result.Object.Description;
                    json.text = '*'+tokens[0]+' - '+result.Results[0].Name+':*';
                    var release = result.Results[0].Release?result.Results[0].Release.Name:'Unscheduled';
                    json.text += '\n> *Release:* '+release;
                    var iter = result.Results[0].Iteration?result.Results[0].Iteration.Name:'Unscheduled';
                    json.text += '\n> *Iteration:* '+iter;
                    json.text += '\n> *Comm Ex Owner:* '+result.Results[0].c_CommExOwner;
                    json.text += '\n> *Status:* '+result.Results[0].c_UserStoryStatus;
                    json.text += '\n> *Comm Ex IT Owner:* '+result.Results[0].c_CommexITOwner;
                    json.text += '\n> *Architect:* '+result.Results[0].c_AssignedArchitect;
                    json.text += '\n> *Design State:* '+result.Results[0].c_DesignState;
                    json.text += '\n> *Developer 1:* '+result.Results[0].c_DeveloperAssigned1;
                    json.text += '\n> *Development Status:* '+result.Results[0].ScheduleState;

                }else{
                    json.text = 'Here is a link to the story: <https://rally1.rallydev.com/#/'+process.env.RALLY_WORKSPACE+'/search?keywords='+tokens[0]+'>';
                }
                res.send(json);
                // request('http://google.com', function (error, response, json) {
                //   if (!error && response.statusCode == 200) {
                //     console.log('Sent back to Slack'); // Print the google web page.
                //   }
                // })
                // res.sendStatus(200);
            }).fail(function(errors) {
                console.log(errors);
            });

        }else{
            // console.log(tokens[0].substr(0,2) );
            // console.log('US-'+tokens[0].substring(2,tokens[0].length - 1));
            json.text = 'Use format: /rally US123 action'
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