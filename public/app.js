// This script file requires sockets in order for the application to work properly
// On Document Load => Call API that returns current question and options
document.addEventListener("DOMContentLoaded", () => {
	getQuestion();
});

// When a user enters a username => A 'new user' will be emitted to server
// for processing with the value of the id 'user-name'
document.getElementById("user-form").addEventListener("submit", e => {
	e.preventDefault();
	socket.emit(
		"new user",
		document.getElementById("user-name").value,
		serverData => {
			// If callback == true, show main display
			if (serverData) {
				document.querySelector(".user-creation").style.display = "none";
				document.querySelector("#main-container").style.display =
					"flex";
			}
		}
	);
	document.getElementById("user-name").value = "";
});

// Function calls API => On promise return, process the data
// and insert the question and options to the page.
const getQuestion = () => {
	fetch("https://thegeekcard-trivia.herokuapp.com/questions") // http://localhost:3500/questions
		.then(response => response.json())
		.then(questionsData => {
			let answers = questionsData.qans;
			document.getElementById("current__question").innerHTML =
				questionsData["q"];

			document.getElementById("current__options").innerHTML = "";
			answers.forEach(option => {
				document.getElementById(
					"current__options"
				).innerHTML += `<h5 class="question__options"><span class="question__option__span" onclick="answerQuestion('${option}')">${option}</span></h5>`;
			});
		});
};

// When a user clicks an option => A response is sent to the server.
// The server will process the answer and emit proper response ("wrong answer" / "new question")
const answerQuestion = response => {
	socket.emit("answer question", response);
};

// Initialize Socket Connection
let socket = io.connect();

// On 'get users' => List out all players with updated scores
socket.on("get users", data => {
	let users = "";
	data.forEach(user => {
		users += `<h5>${user.username} - ${user.score}</h5>`;
	});
	document.getElementById("current__players").innerHTML = users;
});

// On 'new question' => Call API to return a new question to user
socket.on("new question", () => {
	getQuestion();
});

// On 'wrong answer' => Server has recieved an incorrect answer, and user must be noticed
socket.on("wrong answer", () => {
	alert("Wrong answer");
});
