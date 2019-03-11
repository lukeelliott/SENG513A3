var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);


var users = [];
var usernameColors = [];

var chatTimestamps = [];
var chatNames = [];
var chatNameColors = [];
var chatMessages = [];


function generateNickname(){
	userName = "User " + (users.length + 1);
	users.push(userName);
	usernameColors.push('000000'); //black
	return userName;
}

app.get('/', function(req, res){
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	//assign a nickname with a black color
	socket.on('adduser', function(cookiedUsername, cookiedUsernameColor) {
        // check cookie
		if (cookiedUsername != "" && cookiedUsernameColor != "") //cookie exists
		{
			users.push(cookiedUsername);
			usernameColors.push(cookiedUsernameColor);
			name = cookiedUsername;
			color = cookiedUsernameColor;
			socket.emit('serveUsername', name, color);
			// let others know to add this user to their list
			io.emit('userConnected', name, color);
		} else { //this is someone new
			var name = generateNickname();
			var color = usernameColors[users.indexOf(name)];
			socket.emit('serveUsername', name, color);
			// let others know to add this user to their list
			io.emit('userConnected', name, color);
		}		
    });
	
	
	socket.on('chat message', function(msg, nick, nickcolor){
		//first check if it's a username change request
		if (msg.substring(0, 6) == '/nick '){
			//check if the requested name is unique
			for (var j = 0; j < users.length; j++){
				if (msg.substring(6, msg.length) == users[j]) //username is taken
				{
					socket.emit('usernameDenied');
					return;
				}
			}
			//if we get here, the username is good
			newname = msg.substring(6, msg.length);
			users[users.indexOf(nick)] = newname;
			io.emit('usernameChanged', nick, newname);
		} else if(msg.substring(0,11) == '/nickcolor ') { //second check if its a name color change request
			var proposedColor = msg.substring(11,msg.length);
			io.emit('colorChange', nick, proposedColor);
		
		
		} else {
			//get system time
			var timestamp = new Date();
			chatTimestamps.push(timestamp);
			//remember who sent what message along with the time and message
			chatNames.push(nick);
			chatNameColors.push(nickcolor);
			//store the message
			chatMessages.push(msg);
			io.emit('message received', msg, timestamp, nick, nickcolor);
		}
		
	});
	
	socket.on('requestMessages', function(){
		socket.emit('grantMessages', chatTimestamps, chatNames, chatNameColors, chatMessages);
	});
	
	socket.on('requestUserlist', function() {
		socket.emit('grantUserlist', users, usernameColors);
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});
