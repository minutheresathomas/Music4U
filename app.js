
/**
 * Module dependencies.
 */

var express = require('express')
, redis = require('redis')
, routes = require('./routes')
, user = require('./routes/user')
, session = require('express-session')
, redisStore = require('connect-redis')(session)
, http = require('http')
, mysql = require('./routes/db/mysql_connect')
, crypto = require('crypto')
, path = require('path');

var client = redis.createClient(6379, "localhost");
var app = express();

//all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

app.use(session({
	store: new redisStore({ host: 'localhost', port: 6379, client: client }),
	secret: 'musicforu',
	saveUninitialized: true, // don't create session until something stored,
	resave: true // don't save session if unmodified
}));

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

client.on('connect', function() {
	console.log('connected');
});

function generate_sessionId(callback)
{
	var current_date = (new Date()).valueOf().toString();
	var random = Math.random().toString();
	callback(crypto.createHash('sha1').update(current_date + random).digest('hex'));
}

function getValueOfSessionId(callback, sessionId)
{
	client.lrange(ses, 0, -1, function(err, reply)
			{
		if(err)
		{
			console.log(err);
		}
		else {
			console.log('Redis val : '+reply);
			callback(reply);
		}
			});
}

app.get('/session/set/:value', function(req, res) {
	generate_sessionId(function(result) {
		if(result.length != 0) {
			req.session.userId = req.params.value;
			res.send('session written in Redis successfully'+req.session.result);			
		}
	});
});

app.get('/session/get/:sessionId', function(req, res) {
	var ses = req.params.sessionId;
	if(client.lrange(ses, 0, -1, function(err, reply)
			{
		console.log('Redis val : '+reply);
			}))
		res.send('the session value stored in Redis is: ' + req.session.sessionId);
	else
		res.send("no session value stored in Redis ");
});

app.get('/', routes.index);
app.get('/users', user.list);

app.post('/login', function (req, res) {
	if(!req.body.hasOwnProperty('email') ||!req.body.hasOwnProperty('password')) {
		res.statusCode = 400;
		return res.send('Error 400: Post syntax incorrect.');
	}

	mysql.validateUser(function(err,results){
		if(err){
			throw err;
		}else{
			if(results.length == 0)
			{
				var msg = "Your credentials don't match. Please try again.";
				res.end({Error : msg});
			}
			else
			{
				var usrId = results[0].userId;
				generate_sessionId(function(result) {
					if(result.length != 0) {
						client.rpush([result, usrId], function(err, reply) {
							console.log(reply); //prints 2
						});
						req.session.sessionId = result;
						res.end('{\"sessionId\" : \"'+ req.session.sessionId + '\"}');
					}
				});
			}
		}
	},req.param('email'),req.param('password'));

});

app.post('/users', function (req, res) {
	if(!req.body.hasOwnProperty('firstname') ||!req.body.hasOwnProperty('lastname') 
			||!req.body.hasOwnProperty('email') ||!req.body.hasOwnProperty('password')) {
		res.statusCode = 400;
		return res.send('Error 400: Post syntax incorrect.');
	}

	mysql.insertUser(function(err,results){
		if(err){
			throw err;
			console.log(err);
		}else{
			if(results.length == 0)
			{
				var msg = "Not able to store the user";
				res.end({Error : msg});
			}
			else
			{
				var usrId = results[0].userId;
				generate_sessionId(function(result) {
					if(result.length != 0) {
						req.session.userId = usrId;
						req.session.sessionId = result;
						res.end('{\"sessionId\" : \"'+ req.session.sessionId + '\"}');
					}
				});
			}
		}
	},req.param('firstname'),req.param('lastname'), req.param('email'), req.param('password'));
});
///audios?limit_start=0&limit_end=10
app.get('/:sessionId/audios/', function (req, res)
		{

		});

app.get('/audios', function (req, res)
		{
	mysql.getHomeAudioLatest(function(err,results){
		if(err){
			throw err;
			console.log(err);
		}else{
			if(results.length == 0)
			{
				var msg = "Not able to store the user";
				res.end({Error : msg});
			}
			else
			{
				res.end(results);
			}
		}
	});
});

app.get('/audios/trends', function (req, res){
	mysql.getHomeAudioTrendy1(function(err,results){
		if(err){
			throw err;
			console.log(err);
		}else{
			if(results.length == 0)
			{
				var msg = "Not able to retrieve the audio.";
				res.end(msg);
			}
			else
			{
				//res.status(200).send(results);
				res.end('{'+results+'}');
				//res.end(JSON.stringify(results));
			}
		}
	});
});

app.get('/audios/search', function (req, res){
	var queryParams = [];
	mysql.getSearchedAudios(function(err,results){
		if(err){
			throw err;
			console.log(err);
		}else{
			if(results.length == 0)
			{
				var msg = "Not able to retrieve the audio.";
				res.end(msg);
			}
			else
			{
				//res.status(200).send(results);
				res.end('{'+results+'}');
				//res.end(JSON.stringify(results));
			}
		}
	});
});

//post followers
app.get('/users/:userId/newsFeed'){
	
}

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
