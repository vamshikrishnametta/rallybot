var pg = require('pg');
var redis = require('redis');
var bluebird = require('bluebird');
var express = require('express'),
    bodyParser = require('body-parser');
var rally = require('rally'),
    queryUtils = rally.util.query;
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
pg.defaults.ssl = true;
// pg.connect(process.env.DATABASE_URL, function(err, client) {
//                   if (err) throw err;
//                   console.log('Connected to postgres! Getting schemas...');

//                   client
//                     .query('CREATE TABLE user ('+
//                            '   username    varchar(255) CONSTRAINT firstkey PRIMARY KEY,'+
//                            '   apiKey      varchar(64) NOT NULL'+
//                           ');')
//                     .on('end', function() { client.end(); })
//                 });


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
// var redisClient = require('redis').createClient(process.env.REDIS_URL);

var rallyConnectionInfo = {
       // apiKey: process.env.RALLY_API_KEY, //preferred, required if no user/pass, defaults to process.env.RALLY_API_KEY
       apiVersion: 'v2.0', //this is the default and may be omitted
       server: 'https://rally1.rallydev.com',
       requestOptions: {
           headers: {
               'X-RallyIntegrationName': 'Rally Slack Integration',  //while optional, it is good practice to
               'X-RallyIntegrationVendor': 'TJ Madsen',             //provide this header information
               'X-RallyIntegrationVersion': '1.0'                    
           }
           //any additional request options (proxy options, timeouts, etc.)     
       }
   };

var removeHTML = function(inText){
  var outText = inText;
  outText = outText.replace(/<div\s*.*?>/g, '\n');
  outText = outText.replace(/<\/div>/g, '');
  outText = outText.replace(/&nbsp;/g, ' ');
  outText = outText.replace(/&lt;/g, '<');
  outText = outText.replace(/&gt;/g, '>');
  outText = outText.replace(/<b\s*.*?>/g, '*');
  outText = outText.replace(/<\/b>/g, '*');
  outText = outText.replace(/<i\s*.*?>/g, '_');
  outText = outText.replace(/<\/i>/g, '_');
  outText = outText.replace(/<br \/>/g, '\n');
  outText = outText.replace(/<ol\s*.*?>/g, '');
  outText = outText.replace(/<\/ol>/g, '');
  outText = outText.replace(/<ul\s*.*?>/g, '');
  outText = outText.replace(/<\/ul>/g, '');
  outText = outText.replace(/<li\s*.*?>/g, '\n-');
  outText = outText.replace(/<\/li>/g, '');
  outText = outText.replace(/<font\s*.*?>/g, '');
  outText = outText.replace(/<\/font>/g, '');
  outText = outText.replace(/<p\s*.*?>/g, '');
  outText = outText.replace(/<\/p>/g, '');
  outText = outText.replace(/<span\s*.*?>/g, '');
  outText = outText.replace(/<\/span>/g, '');
  return outText;
}

app.post('/rallyslash', function(req, res){
  
  delete rallyConnectionInfo.apiKey;

  if( !(req.body && req.body instanceof Object && Object.keys(req.body).length > 0) ) return res.send(403);

    if(req.body.token == process.env.BOT_TOKEN){
        var message = ' ';
        var json = json = {text: message, username: 'rallybot', icon_emoji: ':nerd:', response_type: 'ephemeral'};
        var text = req.body.text;
        var username = req.body.user_name;
        console.log(req.body);
        var tokens = text.split(" ");
        var type = '';
        var number = 0;
        if(tokens.length >= 1){
          var type = tokens[0].substr(0,2).toUpperCase();
          var number = tokens[0].substring(2,tokens[0].length);
        }
        if(tokens.length >= 1 && tokens[0] == 'help'){
            json.message = 'Use format: /rally US123 action\n\n Possible Actions: \n status \n description \n link \n notes \n design';
            res.send(json);
        }else if(tokens.length >= 1 && tokens[0] == 'register'){
            // if(tokens.length == 2){
            //   rallyConnectionInfo.apiKey = tokens[1];
            //   var restApi = rally(rallyConnectionInfo);
            //   var rallyReqBody = {
            //       type: 'hierarchicalrequirement',
            //       query: queryUtils.where('FormattedID', '=', 'US1'),
            //       fetch: ['FormattedID', 'Name', 'Description', 'Notes', 'CommExOwner', 'UserStoryStatus', 'CommexITOwner', 'AssignedArchitect', 'DesignState', 'Blocked', 'BlockedReason', 'ScheduleState', 'Iteration', 'Release', 'DeveloperAssigned1', 'SystemDesignSuggestions' ], //fields to fetch
            //       limit: Infinity,
            //       order: 'Rank',
            //       requestOptions: {} //optional additional options to pass through to request
            //   };
            //   restApi.query(rallyReqBody).then(function(result) {
            //     pg.connect(process.env.DATABASE_URL, function(err, client) {
            //       if (err) throw err;
            //       console.log('Connected to postgres! Getting schemas...');

            //       client
            //         .query('INSERT INTO user (username, apiKey) VALUES (\''+username+'\',\''+tokens[1]+'\') ON CONFLICT (username) DO UPDATE user SET apiKey = '+tokens[1]+' WHERE username = '+username+';')
            //         .on('end', function() { 
            //           redisClient.set("username", tokens[1]);
            //           client.end(); 
            //         })
            //     });
            //   }).fail(function(errors) {
            //     json.message = 'Invalid API Key';
            //     res.send(json);
            //   });
            // }else{
            //   json.message = 'Use format: /rally register [API_KEY]';
            //   res.send(json);
            // }
        }else if(tokens.length >= 2 && (type == 'US' || type == 'DE') && !isNaN(number)){

            //Get Connection API

            // redisClient.getAsync('username').then(function(res) {
            //   if(res == null){
            //     pg.connect(process.env.DATABASE_URL, function(err, client) {
            //       if (err) throw err;
            //       console.log('Connected to postgres! Getting schemas...');

            //       client
            //         .query('SELECT apiKey FROM user WHERE username = '+username+';')
            //         .on('row', function(row) {
            //           if(row.apiKey && row.apiKey != null){
            //             redisClient.set("username", row.apiKey);
            //             rallyConnectionInfo.apiKey = row.apiKey;
            //           }
            //         });
            //     });
            //   }else{
            //     rallyConnectionInfo.apiKey = res;
            //   }
            // });

            var restApi = rally(rallyConnectionInfo);

            var rallyReqBody = {
                type: 'hierarchicalrequirement',
                query: queryUtils.where('FormattedID', '=', tokens[0]),
                fetch: ['FormattedID', 'Name', 'Description', 'Notes', 'CommExOwner', 'UserStoryStatus', 'CommexITOwner', 'AssignedArchitect', 'DesignState', 'Blocked', 'BlockedReason', 'ScheduleState', 'Iteration', 'Release', 'DeveloperAssigned1', 'SystemDesignSuggestions' ], //fields to fetch
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
                    var release = (typeof result.Results[0].Release != 'undefined' && result.Results[0].Release != null)?result.Results[0].Release.Name:'Unscheduled';
                    json.text += '\n> *Release:* '+release;
                    var iter = (typeof result.Results[0].Release != 'undefined' && result.Results[0].Iteration != null)?result.Results[0].Iteration.Name:'Unscheduled';
                    json.text += '\n> *Iteration:* '+iter;
                    json.text += '\n> *Comm Ex Owner:* '+result.Results[0].c_CommExOwner;
                    json.text += '\n> *Status:* '+result.Results[0].c_UserStoryStatus;
                    json.text += '\n> *Comm Ex IT Owner:* '+result.Results[0].c_CommexITOwner;
                    json.text += '\n> *Architect:* '+result.Results[0].c_AssignedArchitect;
                    json.text += '\n> *Design State:* '+result.Results[0].c_DesignState;
                    json.text += '\n> *Developer 1:* '+result.Results[0].c_DeveloperAssigned1;
                    json.text += '\n> *Development Status:* '+result.Results[0].ScheduleState;

                }else{
                    json.text = 'Here is a link to the story: <https://rally1.rallydev.com/#/'+process.env.RALLY_WORKSPACE+'/search?keywords='+tokens[0]+'|'+tokens[0]+'>';
                }

                if(tokens.length >= 3 && (tokens[1] == 'public' || tokens[1] == 'p')){
                    json.response_type = 'in_channel';
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