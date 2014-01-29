
// Import the http module
var http = require("http");
// Import the file system module
var fs = require("fs");

// Create a new server
var server = http.createServer(function(req,res){
	console.log(req.url);
	var path = req.url;

	if(path === '/'){
		fs.readFile('./index.html', function(error, data){
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.end(data, 'utf-8');
		});
	}else if(path === '/static/pong.js'){
		fs.readFile('./static/pong.js', function(error, data){
			res.writeHead(200, {'Content-Type': 'text/javascript'});
			res.end(data, 'utf-8');
		});
	}else if(path.indexOf('/static/images/') == 0){
		fs.readFile('.' + path, function(error, data){
			res.writeHead(200, {'Content-Type': 'image/bmp'});
			res.end(data, 'utf-8');
		});
	}else{
		res.writeHead(404,{'Content-Type': 'text/plain'});
		res.end("Error 404", "utf-8");
	}


}).listen(3000, "0.0.0.0"); ///////////////////////////////////////////////        <<<<<<<<<<< CHANGE THIS DURING PRODUCTION

console.log("Server started at 0.0.0.0:3000"); ////////////////////////////        <<<<<<<<<<< CHANGE THIS DURING PRODUCTION

// Import the socket.io module
var io = require('socket.io').listen(server);

// My variables for this server
var WIDTH = 600; // The WIDTH and HEIGHT of the 'play field'
var HEIGHT = 400;

var P_WIDTH = 20; // This is the width and height of the ball
var P_HEIGHT = 80;

var FACE_GAP = 40; //the gap between the front face of the paddle and the side of the canvas

var B_WIDTH = 20; // The width and height of the BALL

var players = []; // This will hold an array of objects for each player. Plan to store the score and data here. the index is the ID

/*
 * Each player will have a number associated with who they are.
 * I also plan to have a score for that player,
 * and an optional username.
 */
var player_count = 0; // This keeps track of the current number of connected players
var player_id_count = 1; // This increments IDs so no connected player has the same ID
var p1YPos = HEIGHT/2; // This is the Y position of player 1
var p2YPos = HEIGHT/2; // This is the Y position of player 2
var ballX = 0; // This is the X location of the ball
var ballY = 0; // This is the Y location of the ball
var ballXM = 0; // This is the X momentum of the ball
var ballYM = 0; //  This is the Y momentum of the ball
var BALL_START_SPEED = 2;
var ballXMIncrease = .2;
var paddleBounceWeight = 1.5;
var p1_id = 0; // This is to keep track of what player is currently player1
var p2_id = 0; // This is to keep track of what player is currently player2

var MAX_LIFE = 3;
var p1Life = 2;
var p2Life = 2;

var p1Up = false; //these 4 set to true if the player is holding the appropriate directional button
var p1Down = false;
var p2Up = false;
var p2Down = false;

// The variable that accepts the main loop
var mainLoopInterval = null;
var FRAME_RATE = 16;
var PLAYER_SPEED = 4;


// When a player connects, It will run this function..
io.sockets.on('connection', function(socket){

	// Add one to the players and the player IDs
	player_count++;
	player_id_count++;

	// THIS WILL NEED TO BE CHANGED,
	// The first player to connect is obviously player 1
	if(player_count == 1){
		p1_id = player_id_count;
	}else if(player_count == 2){// The second player to connect is player 2
		p2_id = player_id_count;
	}

	// Log to the console what's going on..
	console.log('User connected. ' + player_count + ' user(s) present.');

	// Emit to the player 
	socket.emit('initial_connection', { // On the initial connection, we send all of the data for the game. INCLUDING STATICS!!
		WIDTH:WIDTH,
		HEIGHT:HEIGHT,
		P_WIDTH:P_WIDTH,
		P_HEIGHT:P_HEIGHT,
		FACE_GAP:FACE_GAP,
		B_WIDTH:B_WIDTH,
		player_count:player_count,
		player_id:player_id_count,
		p1YPos:p1YPos,
		p2YPos:p2YPos,
		players:players,
		FRAME_RATE:FRAME_RATE,
		PLAYER_SPEED:PLAYER_SPEED,
		you_are_p1:(player_count == 1),
		you_are_p2:(player_count == 2),
		MAX_LIFE:MAX_LIFE
	});

	// Plan to do more information with this later, like updating the player list for the users.
	socket.broadcast.emit('player_connected',{number:player_count});

	socket.on('request_start', function(data){
		if(player_count >= 2){

			endGame();
			startGame();
		}
	});

	// When a user disconnects, I would like to see it in the console, we also need to update the total players
	socket.on('disconnect', function(){
		// Update the total player count
		player_count--;

		// Log that the user disconnected
		console.log('User disconnected. ' + player_count + ' user(s) present.');

		// Update ALL OTHER USERS with the new information
		socket.broadcast.emit('users',{number:player_count});

		// //////////////////////////////////////////////////////////// USE SOME MORE LOGIC HERE, DON"T JUST END IT!!!
		endGame();
	});


	// This function is for the client to update the UP ARROW key
	socket.on('up_key', function(data){
		console.log("up_key data received..");

		if(data.player_id == p1_id){
			console.log("player1 send the data...");
			if(data.keyPressed){
				console.log("p1Up = true;");
				p1Up = true;
			}else{
				console.log("p1Up = false;");
				p1Up = false;
			}
		}else if(data.player_id == p2_id){
			if(data.keyPressed){
				p2Up = true;
			}else{
				p2Up = false;
			}
		}
		updatePlayers();
	});

	socket.on('down_key',function(data){
		if(data.player_id == p1_id){
			if(data.keyPressed){
				p1Down = true;
			}else{
				p1Down = false;
			}
		}else if(data.player_id == p2_id){
			if(data.keyPressed){
				p2Down = true;
			}else{
				p2Down = false;
			}
		}
		updatePlayers();
	});





});

// This function updates the players
function updatePlayers(){
	io.sockets.emit('positions',{
		p1YPos:p1YPos,
		p2YPos:p2YPos,
		ballX:ballX,
		ballY:ballY,
		ballXM:ballXM,
		ballYM:ballYM,
		p1Up:p1Up,
		p1Down:p1Down,
		p2Up:p2Up,
		p2Down:p2Down,
		p1Life:p1Life,
		p2Life:p2Life
	});
}

function endGame(){
	io.sockets.emit('stop_game',{
		////
	});
	if(mainLoopInterval != null){
		clearInterval(mainLoopInterval);
	}
}

// This function starts up the game.
function startGame()
{
	io.sockets.emit('start_game',{
		////
	});


	//Set the life
	p1Life = MAX_LIFE;
	p2Life = MAX_LIFE;

	resetBall();
	resetPlayers();
	mainLoopInterval = setInterval(mainLoop, FRAME_RATE);
}

function resetBall(){
	ballX = WIDTH/2;
	ballY = HEIGHT/2;
	var randomMove = (Math.random() * 4) - 2;

	ballXM = -BALL_START_SPEED;
	ballYM = randomMove;
}

function resetPlayers(){


	//when scores are implemented, need to be reset to 0 here
	p1YPos = HEIGHT/2;
	p2YPos = HEIGHT/2;
	p1Up = false;
	p1Down = false;
	p2Up = false;
	p2Down = false;
}




























// This is the main loop
function mainLoop(randomMove)
{
	moveBall(randomMove);
	movePaddles();
	checkBallCollision();
}


function moveBall(randomMove)
{
	// This moves the ball in the right direction
	ballX += ballXM;
	ballY += ballYM;
}

// This moves the paddles
function movePaddles()//keep track of up and down arrow key presses
{
	if (p1Up && (p1YPos > 0))
	{
		p1YPos -= PLAYER_SPEED;
	}
	if (p1Down && (p1YPos + P_HEIGHT < HEIGHT))
	{
		p1YPos += PLAYER_SPEED;
	}
	if (p2Up && (p2YPos > 0))
	{
		p2YPos -= PLAYER_SPEED;
	}
	if (p2Down && (p2YPos + P_HEIGHT < HEIGHT))
	{
		p2YPos += PLAYER_SPEED;
	}
}

// This function calls all the functions related to checking the ball's collision with objects.
function checkBallCollision()
{
	// First, we check if it hit the top or the bottom of the play area
	bounceBallOffTopOrBottom();

	// This function should only be used for test puporses
	// checkHorizontalBallCollisionTEST();
	checkHorizontalBallCollision();

	// Now we bounce the ball off of the paddle
	bounceBallOffPaddle();
}


// This function checks if the ball hit the 'ceiling' or the 'floor' of the 'play area'
function bounceBallOffTopOrBottom(){
	// If the ball hits the top of the 'play area' AND if the ball is moving UP
	if((ballY < 0) && (ballYM < 0)){
		// Turn around the momentum
		ballYM = -ballYM;
		updatePlayers();
	}

	// If the ball hits the bottom of the 'play area' AND if the ball is moving DOWN
	if((ballY + B_WIDTH > HEIGHT) && (ballYM > 0)){
		// Turn around the momentum
		ballYM = -ballYM;
		updatePlayers();
	}
}

// This function checks if the ball bounced off of a paddle
function bounceBallOffPaddle(){

	// We check if the ball is within collision on the x-axis

	// For the LEFT player (Player 1)
	if((ballX < FACE_GAP) &&                       // It's within reach
		(ballX + B_WIDTH > FACE_GAP - P_WIDTH) && // It's NOT BEHIND the paddle
		(ballXM < 0)){                             // AND the ball is GOING left
		// Now we check if it's within he paddle's height
		if((ballY + B_WIDTH > p1YPos) && // The ball is below the top of the paddle
			(ballY < p1YPos + P_HEIGHT)){ // The ball is above the bottom of the paddle
			// We know the ball is inside the paddle, we can now reverse the direction
			ballXM = -ballXM;
			ballXM += ballXMIncrease;

			//Get the relative position of the center of the ball to the center of the paddle -1 -> 1
			relativePosition = ((ballY + (B_WIDTH)/2.0) - (p1YPos + (P_HEIGHT/2.0))) / (P_HEIGHT/2.0);

			// Change the ball's vertical velocity by the relative bounce position
			ballYM += relativePosition * paddleBounceWeight;

			updatePlayers();
		}
	}

	// For the Right player (Player 2)
	if((ballX + B_WIDTH > WIDTH - FACE_GAP) &&   // It's within reach
		(ballX < WIDTH - FACE_GAP + P_WIDTH) &&    // It's NOT BEHIND the paddle
		(ballXM > 0)){                             // AND the ball is GOING left
		// Now we check if it's within he paddle's height
		if((ballY + B_WIDTH > p2YPos) && // The ball is below the top of the paddle
			(ballY < p2YPos + P_HEIGHT)){ // The ball is above the bottom of the paddle
			// We know the ball is inside the paddle, we can now reverse the direction
			ballXM = -ballXM;
			ballXM -= ballXMIncrease;

			//Get the relative position of the center of the ball to the center of the paddle -1 -> 1
			relativePosition = ((ballY + (B_WIDTH)/2.0) - (p2YPos + (P_HEIGHT/2.0))) / (P_HEIGHT/2.0);

			// Change the ball's vertical velocity by the relative bounce position
			ballYM += relativePosition * paddleBounceWeight;

			updatePlayers();
		}
	}
}

// This function checks if the ball hit the side (resulting in a win/loss)
function checkHorizontalBallCollision(){
	// If the ball is moving left and hits the left...
	if((ballX < 0) && (ballXM < 0)){
		// Turn around the momentum
		resetPlayers();
		resetBall();
		p1Life--;
		if(p1Life <= 0){
			endGame();
		}
		updatePlayers();
	}

	// If the ball is moving right and hits the right
	if((ballX + B_WIDTH > WIDTH) && (ballXM > 0)){
		// Turn around the momentum
		resetPlayers();
		resetBall();
		p2Life--;
		if(p2Life <= 0){
			endGame();
		}
		updatePlayers();
	}
}

// This function should be only used for testing puporses
function checkHorizontalBallCollisionTEST(){
	// MOVING LEFT
	if((ballX < 0) && (ballXM < 0)){
		// Turn around the momentum
		ballXM = -ballXM;
		updatePlayers();
	}

	// IMOVING RIGHT
	if((ballX + B_WIDTH > WIDTH) && (ballXM > 0)){
		// Turn around the momentum
		ballXM = -ballXM;
		updatePlayers();
	}
}




















