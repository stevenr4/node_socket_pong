

// When the document is loaded and ready, run this function
$(document).ready(function(){

	// This is the static WIDTH and HEIGHT variables (Overwritten when connection is declared)
	var WIDTH = 0;
	var HEIGHT = 0;

	// These are the static player width/height variables (Again, Overwritten when connection is declared)
	var P_WIDTH = 00;
	var P_HEIGHT = 00;

	// These are the static variables for the ball
	var B_WIDTH = 0;


	// These are the Y positions of the players
	var p1YPos = 0;
	var p2YPos = 0;

	// This is the X and Y coords of the ball
	var ballX = 0;
	var ballY = 0;

	var ballXM = 0;
	var ballYM = 0;

	// The ID of a player
	var player_id = null;

	var p1Up = false; //these 4 set to true if the player is holding the appropriate directional button
	var p1Down = false;
	var p2Up = false;
	var p2Down = false;

	// THe main loop interval
	var mainLoopInterval = null;
	var countDownInterval = null;
	var gameStartTime = 0;


	// This will be overwritten by the server.
	var FRAME_RATE = 100;
	var PLAYER_SPEED = 0;

	var i_am_p1 = false;
	var i_am_p2 = false;

	var MAX_LIFE = 2;
	var p1Life = 0;
	var p2Life = 0;


	// Get the canvas that we will be printing to
	var c = document.getElementById("my_canvas");
	
	//The context of the canvas
	var ctx = c.getContext("2d");

	// This is for the pixel art
	ctx.imageSmoothingEnabled = false;
	ctx.mozImageSmoothingEnabled = false;
	ctx.webkitImageSmoothingEnabled = false;

	// These are to check states
	var stateCountDown = false;
	var stateWait = true;

	// Images
	var imgLeftPaddle = new Image();
	imgLeftPaddle.src = "/static/images/left_paddle.bmp";
	var imgRightPaddle = new Image();
	imgRightPaddle.src = "/static/images/right_paddle.bmp";
	var imgBall = new Image();
	imgBall.src = "/static/images/ball.bmp";
	var imgHeartEmpty = new Image();
	imgHeartEmpty.src = "/static/images/heartempty.bmp";
	var imgHeartFull = new Image();
	imgHeartFull.src = "/static/images/heartfull.bmp";


	imgLeftPaddle.onLoad = refreshScreen;
	imgRightPaddle.onLoad = refreshScreen;
	imgBall.onLoad = refreshScreen;
	imgHeartEmpty.onLoad = refreshScreen;
	imgHeartFull.onLoad = refreshScreen;


	// Create the socket for us to send data to
	var socket = io.connect(window.location.origin);

	// When the server sends out an 'initial_connection'
	socket.on('initial_connection', function(data){
		console.log("Initially connected...");
		console.log(data);
		p1YPos = data.p1YPos;
		p2YPos = data.p2YPos;
		player_id = data.player_id;
		WIDTH = data.WIDTH;
		HEIGHT = data.HEIGHT;
		P_WIDTH = data.P_WIDTH;
		P_HEIGHT = data.P_HEIGHT;
		B_WIDTH = data.B_WIDTH;
		PLAYER_SPEED = data.PLAYER_SPEED;
		FRAME_RATE = data.FRAME_RATE;
		MAX_LIFE = data.MAX_LIFE;
		i_am_p1 = data.you_are_p1;
		i_am_p2 = data.you_are_p2;
		console.log("Initial connection complete...");
		console.log(FRAME_RATE);
		refreshScreen();
		socket.emit('request_start',{});
	});

	// The server updates the positions
	socket.on('positions', function(data){
		console.log("Got Positions!");
		p1YPos = data.p1YPos;
		p2YPos = data.p2YPos;
		ballX = data.ballX;
		ballY = data.ballY;
		ballXM = data.ballXM;
		ballYM = data.ballYM;
		p1Up = data.p1Up;
		p1Down = data.p1Down;
		p2Up = data.p2Up;
		p2Down = data.p2Down;
		p1Life = data.p1Life;
		p2Life = data.p2Life;
		refreshScreen();
	});

	// This is for pre-game count down and setup
	socket.on('pre_game', function(data){
		stateCountDown = true;
		stateWait = false;
		console.log("Starting Count Down!");
		console.log(data);
		gameStartTime = data.startTime;
		if(countDownInterval != null){
			clearInterval(countDownInterval);
			countDownInterval = null;
		}
		gameStartTime = data.startTime;
		countDownInterval = setInterval(preGameLoop, FRAME_RATE);
	});

	// When the server tells us that we are starting the game...
	socket.on('start_game', function(data){
		stateCountDown = false;
		// Start interval for main loop
		console.log("STARTING");
		console.log(FRAME_RATE);


		clearInterval(countDownInterval);
		if(mainLoopInterval != null){
			clearInterval(mainLoopInterval);
		}
		mainLoopInterval = setInterval(mainLoop, FRAME_RATE);
	});

	// When the server tells us that we are stopping the game
	socket.on('stop_game', function(data){
		clearInterval(mainLoopInterval);
		clearInterval(countDownInterval);
	});

	socket.on('disconnect', function(){
		console.log("ERRORORORO!");
		clearInterval(mainLoopInterval);
		clearInterval(countDownInterval);
	});





	// This function is for the pre-game loop
	function preGameLoop(){
		refreshScreen();
		printCountDown(gameStartTime);
	}

	// This is the mail looop for the game
	function mainLoop(){
		moveBall();
		movePlayers();
		refreshScreen();
	}

	// This moves the ball
	function moveBall(){
		ballX += ballXM;
		ballY += ballYM;
	}

	// This moves the players
	function movePlayers(){
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




	/// THIS SECTION MANAGES THE KEY PRESSES AND UPDATES THE SERVER
	window.addEventListener('keydown', changeKeyDown, true);
	window.addEventListener('keyup', changeKeyUp, true);
	// 38 = UP
	// 40 = DOWN

	function changeKeyDown(evt){

		// Make sure we are one of the two players
		if(i_am_p1 || i_am_p2){

			if(player_id){
				var key = evt.keyCode;
				if(key==38){       // UP
					socket.emit('up_key',{player_id:player_id,keyPressed:true});
					if(i_am_p1){
						p1Up = true;
					}else if(i_am_p2){
						p2Up = true;
					}
				}else if(key==40){ // DOWN
					socket.emit('down_key',{player_id:player_id,keyPressed:true});
					if(i_am_p1){
						p1Down = true;
					}else if(i_am_p2){
						p2Down = true;
					}
				}
			}
		}
	}
	function changeKeyUp(evt){
		// Make sure we are one of the two players
		if(i_am_p1 || i_am_p2){

			if(player_id){
				var key = evt.keyCode;
				if(key==38){       // UP
					console.log("Sending up-key was released!");
					socket.emit('up_key',{player_id:player_id,keyPressed:false});
					if(i_am_p1){
						p1Up = false;
					}else if(i_am_p2){
						p2Up = false;
					}
				}else if(key==40){ // DOWN
					socket.emit('down_key',{player_id:player_id,keyPressed:false});
					if(i_am_p1){
						p1Down = false;
					}else if(i_am_p2){
						p2Down = false;
					}
				}
			}
		}
	}

	function moveDown(){
		if(player_id != null){
			socket.emit('request_move_down',{
				player_id:player_id
			});
		}else{
			alert("Didn't connect to server!");
		}
	}







	// This section is just for the screen, printing it and clearing it.
	function cls(){
		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,WIDTH,HEIGHT);
	}
	function printLife(){

		// ======= OLD WAY =========
		// ctx.fillStyle = "#FFFFFF";
		// ctx.font="30px Arial";
		// ctx.fillText("P1: " + String(leftScore),40,50);
		// ctx.fillText("P2: " + String(leftScore),WIDTH - 110,50);

		// IMAGES
		for(p1LifeIndex = 1; p1LifeIndex <= 3; p1LifeIndex++){
			if(p1Life >= p1LifeIndex){
				ctx.drawImage(imgHeartFull, 40 + (p1LifeIndex * 32), 20, 28,28);
			}else{
				ctx.drawImage(imgHeartEmpty, 40 + (p1LifeIndex * 32), 20, 28,28);
			}
		}

		for(p2LifeIndex = 1; p2LifeIndex <= 3; p2LifeIndex++){
			if(p2Life >= p2LifeIndex){
				ctx.drawImage(imgHeartFull, WIDTH - ((p2LifeIndex * 32) + 60), 20, 28,28);
			}else{
				ctx.drawImage(imgHeartEmpty, WIDTH - (60 + (p2LifeIndex * 32)), 20, 28,28);
			}
		}
	}
	function printPlayers(){
		ctx.fillStyle = "#FFFFFF";

		// PLAYER 1
		ctx.fillRect(20,p1YPos,P_WIDTH,P_HEIGHT);
		ctx.drawImage(imgLeftPaddle,20,p1YPos,P_WIDTH,P_HEIGHT);

		// PLAYER 2
		ctx.fillRect(WIDTH - 20 - P_WIDTH,p2YPos,P_WIDTH,P_HEIGHT);
		ctx.drawImage(imgRightPaddle,WIDTH - 20 - P_WIDTH,p2YPos,P_WIDTH,P_HEIGHT);
	}
	function printBall(){
		// Classic ball, if the image fails to load
		ctx.beginPath();
		ctx.arc(ballX + B_WIDTH/2, ballY + B_WIDTH/2, B_WIDTH/2, 0, 2 * Math.PI, false);
		ctx.fillStyle = '#FFFFFF';
		ctx.fill();
		ctx.closePath();

		//The ball image
		ctx.drawImage(imgBall,ballX,ballY,B_WIDTH,B_WIDTH);
	}
	function refreshScreen(){
		cls();
		printLife();
		printBall();
		printPlayers();

		if(stateCountDown){
			printCountDown(gameStartTime);
		}else if(stateWait){
			printWaiting();
		}
	}

	function printCountDown(startTime){
		// This gets the amount of seconds left
		var secondsLeft = Math.round((startTime - (new Date().getTime()))/1000) + 1;
		// Print out the seconds
		ctx.fillStyle = "#FFFFFF";
		ctx.font="40px Arial";
		ctx.fillText("Starting Game...",150,100);
		ctx.fillText(secondsLeft,250,150);
	}

	function printWaiting(){
		// Print out the waiting sign
		ctx.fillStyle = "#FFFFFF";
		ctx.font="40px Arial";
		ctx.fillText("Waiting for Players",120,100);
	}


});








