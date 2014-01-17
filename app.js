//checking if this stuff works
var http = require("http");
var fs = require("fs");

var server = http.createServer(function(req,res){
	fs.readFile('./index.html', function(error, data){
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(data, 'utf-8');
	});
}).listen(3000, "127.0.0.1");

console.log("Server started at 127.0.0.1:3000");

var io = require('socket.io').listen(server);

// My variables for this server
var WIDTH = 600;
var HEIGHT = 400;
var P_WIDTH = 20;
var P_HEIGHT = 80;
var FACE_GAP = 40; //the gap between the front face of the paddle and the side of the canvas
var B_WIDTH = 10;
var B_HEIGHT = 10;
var players = [];
/*
 * Each player will have a number associated with who they are.
 * I also plan to have a score for that player,
 * and an optional username.
 */
var player_count = 0;
var player_id_count = 1;
var p1YPos = HEIGHT/2;
var p2YPos = HEIGHT/2;
var ballX = 0;
var ballY = 0;
var ballXM = 0;
var ballYM = 0;
var p1Up = false; //these 4 set to true if the player is holding the appropriate directional button
var p1Down = false;
var p2Up = false;
var p2Down = false;


// This is where the data is sent back and forth.
io.sockets.on('connection', function(socket){

	player_count++;
	player_id_count++;
	console.log('User connected. ' + player_count + ' user(s) present.');


	socket.emit('initial_connection', { 
		player_count:player_count,
		player_id:player_id_count,
		p1YPos:p1YPos,
		p2YPos:p2YPos,
		players:players
	});

	socket.broadcast.emit('player_connected',{number:player_count});
	socket.on('disconnect', function(){
		player_count--;
		console.log('User disconnected. ' + player_count + ' user(s) present.');
		socket.broadcast.emit('users',{number:player_count});
	});










	socket.on('move_down', function(socket){
		p1YPos += 10;
		socket.broadcast.emit('positions',{p1YPos:p1YPos,p2YPos:p2YPos});
		socket.emit('positions',{p1YPos:p1YPos,p2YPos:p2YPos});
	});
















	socket.on('move_up', function(socket){
		p1YPos -= 10;
		socket.broadcast.emit('positions',{p1YPos:p1YPos,p2YPos:p2YPos});
		socket.emit('positions',{p1YPos:p1YPos,p2YPos:p2YPos});
	});
});

//ALWAYS PULL BEFORE YOU ADD ANYTHING
function startGame()
{
	//when scores are implemented, need to be reset to 0 here
	p1YPos = HEIGHT/2;
	p2YPos = HEIGHT/2;
	ballX = 300;
	ballY = 200;
	mainLoop();
}

function mainLoop()
{
	
}


function moveBall()
{
	
}

function movePaddles()
{
	
}

function checkBallCollision()
{
	
}




























