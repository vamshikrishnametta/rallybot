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
pg.connect(process.env.DATABASE_URL, function(err, client) {
                  if (err) throw err;
                  console.log('Connected to postgres! Getting schemas...');

                  // client
                  //   .query('CREATE TABLE user ( username varchar(255) PRIMARY KEY, apiKey varchar(64) NOT NULL );')
                  //   .on('end', function() { client.end(); })

                  client.query('CREATE TABLE IF NOT EXISTS integration_user ( username varchar(255) PRIMARY KEY, apiKey varchar(64) NOT NULL );', 
                    function(err, result) {
                      if(err) {
                        return console.error('error running query', err);
                      }
                      client.query('CREATE FUNCTION merge_db(user_name varchar(255), key varchar(64)) RETURNS VOID AS $$ BEGIN LOOP UPDATE integration_user SET apiKey = key WHERE username = user_name; IF found THEN RETURN; END IF; BEGIN INSERT INTO integration_user (username, apiKey) VALUES (user_name,key); RETURN; EXCEPTION WHEN unique_violation THEN END; END LOOP; END; $$ LANGUAGE plpgsql;', 
                        function(err, result) {
                          if(err) {
                            return console.error('error running query', err);
                          }
                          client.end();
                        });
                    });
                });


bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
var redisClient = require('redis').createClient(process.env.REDIS_URL);

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
  if(inText == null){
    return '';
  }else{
    var outText = inText;
    outText = outText.replace(/<div\s*.*?>/g, '\n');
    outText = outText.replace(/<\/div>/g, '');
    outText = outText.replace(/&nbsp;/g, ' ');
    outText = outText.replace(/&lt;/g, '<');
    outText = outText.replace(/&gt;/g, '>');
    outText = outText.replace(/<b\s*.*?>/g, '*');
    outText = outText.replace(/<\/b>/g, '*');
    outText = outText.replace(/<\/blockquote>/g, '*');
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
}

app.post('/rallyslash', function(req, res){
  
  delete rallyConnectionInfo.apiKey;

  if( !(req.body && req.body instanceof Object && Object.keys(req.body).length > 0) ) return res.send(403);

    if(req.body.token == process.env.BOT_TOKEN){
        var message = ' ';
        var json = json = {'text': message, 'username': 'rallybot', 'response_type': 'ephemeral'};
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
            json.text = 'Use format: /rally US123 action\n\n Possible Actions: \n status \n description \n link \n notes \n design\n\n Add *_\'p\'_* to the end to post to the channel for others \n\nRegister your API Key to perform updates by using /rally register';
            res.send(json);
        }else if(tokens.length >= 1 && tokens[0] == 'register'){
            if(tokens.length == 2){
              console.log('Found 2 tokens');
              rallyConnectionInfo.apiKey = tokens[1];
              var restApi = rally(rallyConnectionInfo);
              var rallyReqBody = {
                  type: 'hierarchicalrequirement',
                  query: queryUtils.where('FormattedID', '=', 'US1'),
                  fetch: ['FormattedID', 'Name', 'Description', 'Notes', 'CommExOwner', 'UserStoryStatus', 'CommexITOwner', 'AssignedArchitect', 'DesignState', 'Blocked', 'BlockedReason', 'ScheduleState', 'Iteration', 'Release', 'DeveloperAssigned1', 'SystemDesignSuggestions' ], //fields to fetch
                  limit: Infinity,
                  order: 'Rank',
                  requestOptions: {} //optional additional options to pass through to request
              };
              restApi.query(rallyReqBody).then(function(result) {
                pg.connect(process.env.DATABASE_URL, function(err, client) {
                  if (err) throw err;
                  console.log('Connected to postgres! Creating user');

                  client.query('SELECT merge_db(\''+username+'\',\''+tokens[1]+'\');', 
                    function(err, result) {
                      if(err) {
                        json.text = 'Unable to save API Key';
                        res.send(json);
                        client.end();
                        return console.error('error running query', err);
                      
                      }
                      console.log('Successfully registered '+username+' with API Key: '+tokens[1]+' ');
                      json.text = 'Successfully registered '+username+' with API Key: '+tokens[1]+' ';
                      redisClient.set("username", tokens[1]);
                      client.end();
                      res.send(json);
                    });
                });
              }).fail(function(errors) {
                console.log('Invalid API Key');
                json.message = 'Invalid API Key';
                res.send(json);
              });
            }else{
              json.text = '1. Login to your <https://rally1.rallydev.com/#/'+process.env.RALLY_WORKSPACE+'/|Rally Workspace>\n2. Click the follwing link to <https://rally1.rallydev.com/login/accounts/index.html#/keys|Register an API Key>\n3. Copy the newly created API Key\n4. Use the following command in Slack: /rally register [API_KEY]';
              res.send(json);
            }
        }else if(tokens.length >= 2 && (type == 'US' || type == 'DE') && !isNaN(number)){

            //Get Connection API

            redisClient.getAsync('username').then(function(res) {
              if(res == null){
                pg.connect(process.env.DATABASE_URL, function(err, client) {
                  if (err) throw err;
                  console.log('Connected to postgres! Getting schemas...');

                  client
                    .query('SELECT apiKey FROM integration_user WHERE username = '+username+';')
                    .on('row', function(row) {
                      if(row.apiKey && row.apiKey != null){
                        redisClient.set("username", row.apiKey);
                        rallyConnectionInfo.apiKey = row.apiKey;
                      }
                    });
                });
              }else{
                rallyConnectionInfo.apiKey = res;
              }
            });

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
                  var updateCall = false;
                  //console.log(result);
                  //console.log(result.Results);
                  if(tokens[1] == 'description' || tokens[1] == 'd'){
                      // json.message = result.Object.Description;
                      json.text = '*'+tokens[0]+' - '+result.Results[0].Name+':* \n>>>'+removeHTML(result.Results[0].Description);

                  }else if(tokens[1] == 'notes' || tokens[1] == 'n'){
                      // json.message = result.Object.Description;
                      if(tokens.length >= 3){
                        updateCall = true;
                        console.log('Trying to Update');
                        tokens.shift();
                        tokens.shift();
                        var d = new Date();
                        var notes = d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()+' - '+username+' [via Slack]: '+tokens.join(' ');
                        var rallyUpdateBody = {
                          ref: result.Results[0],
                          data: {
                              Notes: result.Results[0].Notes + '<br /><br />' + notes
                          },
                          fetch: ['FormattedID','Name']
                        };
                        //console.log(rallyUpdateBody);
                        restApi.update(rallyUpdateBody).then(function(result) {
                          console.log('Update Success');
                          console.log(result);
                          json.text = '*'+result.Object.FormattedID+' - '+result.Object.Name+':* Successfully added notes:\n'+notes;
                          res.send(json);
                        }).fail(function(errors) {
                          console.log('Update Error');
                            console.log(errors);
                        });

                      }else{
                        json.text = '*'+tokens[0]+' - '+result.Results[0].Name+':* \n_Notes_\n>>>'+removeHTML(result.Results[0].Notes);
                        //res.send(json);
                      }
                      

                  }else if(tokens[1] == 'design' || tokens[1] == 'sds'){
                      // json.message = result.Object.Description;
                      
                      if(tokens.length >= 3 && (tokens[2] == 'complete' || tokens[2] == 'c')){
                        updateCall = true;
                        console.log('Trying to Update');
                        var rallyUpdateBody = {
                          ref: result.Results[0],
                          data: {
                              c_DesignState: '5. Design Complete'
                          },
                          fetch: ['Name']
                        };
                        //console.log(rallyUpdateBody);
                        restApi.update(rallyUpdateBody).then(function(result) {
                          console.log('Update Success');
                          console.log(result);
                          json.text = '*'+tokens[0]+' - '+result.Object.Name+':* Design State is now _5. Design Complete_';
                          res.send(json);
                        }).fail(function(errors) {
                          console.log('Update Error');
                            console.log(errors);
                        });

                      }else{
                        json.text = '*'+tokens[0]+' - '+result.Results[0].Name+':* \n_Design_\n>>>'+removeHTML(result.Results[0].c_SystemDesignSuggestions);
                        //res.send(json);
                      }

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

                  if(tokens.length >= 2 && (tokens[tokens.length - 1] == 'public' || tokens[tokens.length - 1] == 'p')){
                      json.response_type = 'in_channel';
                      
                  }

                  if(!updateCall){
                      res.send(json);
                  }
                  
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