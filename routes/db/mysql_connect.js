var mysql = require('mysql');
var async = require('async');
var pool = mysql.createPool({
	host     : 'localhost',
	user     : 'root',
	password : '',
	port: '3306',
	database: 'music4u'
});

function insertUser(callback,firstname,lastname,email,password){

	var sql = "INSERT INTO User (password, firstname, lastname, email) VALUES('"+ password + "','" + firstname + "','" + lastname + "','" + email + "')";
	console.log(sql);
	pool.getConnection(function(err, connection){
		connection.query(sql, function(err, results) {
			if (err) {
				throw err;
			}
			else
			{
				callback(err, results);
			}
			console.log(results);
		});
		connection.release();
	});	
}

function validateUser(callback,email,password){
	console.log("Email: " + email + "Password: " + password);
	var sql = "SELECT * FROM User where email = '" + email + "'" + " and password = '" + password + "'";
	console.log(sql);
	pool.getConnection(function(err, connection){
		connection.query( sql,  function(err, rows){
			if(err)	{
				throw err;
			}else{		  		
				console.log("DATA : "+JSON.stringify(rows));
				callback(err, rows);		  		
			}
		});		  
		connection.release();
	});	
}

function getHomeAudioLatest(callback, slimit, elimit){
	var sql = "SELECT * FROM Audio JOIN Likes JOIN Comments ORDER BY creationDate DESC LIMIT "+slimit+", "+elimit;
	pool.getConnection(function(err, connection){
		connection.query( sql,  function(err, rows){
			if(err)	{
				throw err;
			}else{
				if(rows.length!==0){
					console.log("DATA : "+JSON.stringify(rows));
					callback(err, JSON.stringify(rows));
				}
			}
		});		  
		connection.release();
	});
}

function getSpecificAudio(callback, audioId)
{
	var sql = "SELECT * FROM Audio WHERE audioId = "+audioId;
	pool.getConnection(function(err, connection){
		connection.query( sql,  function(err, row){
			if(err)	{
				throw err;
			}else{
				if(row.length!==0){
					console.log("DATA : "+JSON.stringify(row));
					callback(err, JSON.stringify(row));
				}
			}
		});		  
		connection.release();
	});
}

function getHomeAudioTrendy(callback){
	var sql = "SELECT DISTINCT audioLiked, COUNT(audioLiked) AS CountOf FROM Likes GROUP BY audioLiked;";
	pool.getConnection(function(err, connection){
		connection.query( sql,  function(err, rows){

			if(rows.length!==0){
				var audios = [];
				//async
				async.forEach(rows, getSpecificAudio, afterAllTasks);
				function getSpecificAudio(row, callback)
				{
					console.log('JSON row : '+JSON.stringify(row));
					var audioRow = JSON.stringify(row);
					var audioId = row.audioLiked;
					console.log('audio id : '+audioId);
					var sql = "SELECT * FROM Audio WHERE audioId = "+audioId;
					connection.query( sql,  function(err, row){
						if(err)	{
							throw err;
						}else{
							if(row.length!==0){
								audios.push(JSON.stringify(row));
								callback(err);
							}
						}
					});		  
				}
				function afterAllTasks(err) {
					console.log("DATA : "+audios);
					callback(err, audios);
				}
			}
		});		  
		connection.release();
	});
}

function getSearchedAudios(callback, search){
	var sql = "SELECT * FROM Audio where ";
	pool.getConnection(function(err, connection){
		connection.query( sql,  function(err, rows){

			if(rows.length!==0){
				var audios = [];
				//async
				async.forEach(rows, getSpecificAudio, afterAllTasks);
				function getSpecificAudio(row, callback)
				{
					console.log('JSON row : '+JSON.stringify(row));
					var audioRow = JSON.stringify(row);
					var audioId = row.audioLiked;
					console.log('audio id : '+audioId);
					var sql = "SELECT * FROM Audio WHERE audioId = "+audioId;
					connection.query( sql,  function(err, row){
						if(err)	{
							throw err;
						}else{
							if(row.length!==0){
								audios.push(JSON.stringify(row));
								callback(err);
							}
						}
					});		  
				}
				function afterAllTasks(err) {
					console.log("DATA : "+audios);
					callback(err, audios);
				}
			}
		});		  
		connection.release();
	});
}

exports.insertUser = insertUser;
exports.validateUser = validateUser;
exports.getHomeAudioLatest = getHomeAudioLatest;
exports.getHomeAudioTrendy = getHomeAudioTrendy;