// Required Dependencies
// These are all external packages needed
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io").listen(server);

const cors = require("cors");
const path = require("path");

// Users Array (Username/Score) & Connections Array (Socket Objects). This needs to be extensible
// as these are just arrays in memory
let users = [];
let connections = [];

// Server Questions List
let questions = [
	"What is the best programming language in the world?",
	"Lord of the rings director?",
	"What is Planck's constant?"
];

// Server Options List
let answers = [
	["JavaScript", "Cobol", "C#", "Java"],
	["Peter Jackson", "Christopher Nolan", "John K", "Michael Sabal"],
	["6.62607004", "6.62607454", "2.64607004", "6.34454365"]
];

// CurrentQuestion - Determines Question Sent To Client
let currentQuestion = 2;

// Shuffle() - Scrambles Order Of Answer Options From Client To Client And
// When Questions Repeat, The Order Is Still Random
const shuffle = array => {
	return array.sort(() => Math.random() - 0.5);
};

// Listening On Server
server.listen(process.env.PORT || 3500);
console.log("Server Running");

// Allow Cors and Static Files From Public Directory
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Root Endpoint - Sends Main Index To Client
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/public/index.html");
});

// Questions Endpoint - Sends Question And Options Array
app.get("/questions", (req, res) => {
	res.json({
		q: questions[currentQuestion],
		qans: shuffle(answers[currentQuestion])
	});
});

// Connection Made To Socket
io.sockets.on("connection", socket => {
	// Connect & Add Socket To Connections Array
	connections.push(socket);
	console.log(`Connection: ${connections.length} socket(s) connected`);

	// Disconnect Client
	socket.on("disconnect", data => {
		// RemoveUserIndex => Finds Index Of Disconnected User And Removes It
		const removeUserIndex = () => {
			for (let i = 0; i < users.length; i++) {
				if (users[i].username == socket.username) {
					return i;
				}
			}
		};
		users.splice(removeUserIndex(), 1);

		updateUsernames(); // Update Users List On Client

		// Remove Socket Connection From Sockets Array
		connections.splice(connections.indexOf(socket), 1);
		console.log("Disconnected: %s sockets connected", connections.length);
	});

	// Client Answers Question And Server Checks
	socket.on("answer question", data => {
		let corrent = checkAnswers(data); // Answer Checked In Function
		if (corrent) {
			// Find Particular User And Add One To Score
			let socketUserInstance = users.find(
				o => o.username === socket.username
			);
			socketUserInstance.score += 1;

			// Update List Of Users With New Scores
			updateUsernames();

			// Update Quetion Number To Cycle Through
			switch (currentQuestion) {
				case 0:
					currentQuestion = 1;
					break;
				case 1:
					currentQuestion = 2;
					break;
				case 2:
					currentQuestion = 0;
					break;
			}

			// Tells Clients To Get New Questions From Endpoint
			io.sockets.emit("new question");
		} else {
			// Tell Specific Client (socket.id) That Their Answer Was Wrong
			io.to(socket.id).emit("wrong answer");
		}
	});

	// New User Added With Particular Username And Default Score
	socket.on("new user", (data, callback) => {
		// Tell Client To Run Its Callback
		callback(true);

		// Add Info And Append To Users Array
		socket.username = data;
		socket.score = 0;
		users.push({ username: socket.username, score: socket.score });

		// Tell Sockets To Get New Updated List
		updateUsernames();
	});

	// Tells Client To Take New List Of Users
	const updateUsernames = () => {
		io.sockets.emit("get users", users);
	};
});

// CheckAnswers => Determines Answer Accuracy
const checkAnswers = userAnswer => {
	switch (currentQuestion) {
		case 0:
			return userAnswer == "JavaScript" ? true : false;
		case 1:
			return userAnswer == "Peter Jackson" ? true : false;
		case 2:
			return userAnswer == "6.62607004" ? true : false;
	}
};
