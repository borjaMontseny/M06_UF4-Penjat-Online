document.addEventListener("DOMContentLoaded", function () {
    // Variables globals
    var gameStatus = {}; // Definir la variable gameStatus aquí

    // PENJAT ONLINE
    var roomCode;
    var roomPassword = "XXX"; // No demanarem contrasenya, serà aquesta per defecte

    // Text de l'HTML que modificarem per saber si som Player1 o Player2
    var clueText = document.getElementById("clue").getElementsByTagName("span")[0];

    var opcio = confirm("El Penjat Online\n\n- Unir-se a una sala → Acceptar.\n\n- Crear una sala       → Cancelar.");

    if (opcio) {
        clueText.innerHTML = "P2";
        roomCode = prompt("Sala on et vols unir");

        // Realitzar la petició AJAX per unir-se a la sala
        var xhrJoinGame = new XMLHttpRequest();
        xhrJoinGame.open("POST", "https://penjat.codifi.cat", true);
        xhrJoinGame.setRequestHeader("Content-Type", "application/json");
        xhrJoinGame.onreadystatechange = function () {
            if (xhrJoinGame.readyState === 4 && xhrJoinGame.status === 200) {
                var jsonResponse = JSON.parse(xhrJoinGame.responseText);
                console.log("T'has unit a la sala " + roomCode + " correctament.");
                console.log(jsonResponse);
                updateGameState(jsonResponse);
            }
        };
        xhrJoinGame.send(JSON.stringify({ "action": "infoGame", "gameName": roomCode }));

    } else {
        clueText.innerHTML = "P1";
        roomCode = prompt("Nom de la sala que vols crear");

        // Realitzar la petició AJAX per crear la sala
        var xhrCreateGame = new XMLHttpRequest();
        xhrCreateGame.open("POST", "https://penjat.codifi.cat", true);
        xhrCreateGame.setRequestHeader("Content-Type", "application/json");
        xhrCreateGame.onreadystatechange = function () {
            if (xhrCreateGame.readyState === 4 && xhrCreateGame.status === 200) {
                console.log("La sala " + roomCode + " s'ha creat correctament");
                console.log(xhrCreateGame.responseText);
            }
        };
        xhrCreateGame.send(JSON.stringify({ "action": "createGame", "gameName": roomCode, "gamePassword": roomPassword }));
    }

    // Assignació de variables en carregar el DOM completament
    var newGameButton = document.getElementById("new_game");
    var letters = document.getElementById("letters");
    letters.innerHTML = " ";
    var livesText = document.getElementById("lives"); // Variable afegida per actualitzar les vides
    var lives = 5; // Variable que emmagatzema la quantitat de vides

    // Assignació d'esdeveniments
    document.body.addEventListener("keydown", pressKey);
    newGameButton.addEventListener("click", restartGame);

    // Actualitzar l'estat del joc cada 3 segons
    setInterval(actualizarEstadoJuegoPeriodicamente, 3000);

    function pressKey(event) {
        var pressedKey = event.key.toUpperCase();

        if (!/^[A-Z]$/i.test(pressedKey)) {
            return;
        }

        // Construir l'objecte JSON a enviar
        var playData = {
            "action": "playGame",
            "gameName": roomCode,
            "word": pressedKey,
            "player": (clueText.innerHTML === "P1") ? "P1" : "P2"
        };

        var xhrPlayGame = new XMLHttpRequest();
        xhrPlayGame.open("POST", "https://penjat.codifi.cat", true);
        xhrPlayGame.setRequestHeader("Content-Type", "application/json");
        xhrPlayGame.onreadystatechange = function () {
            if (xhrPlayGame.readyState === 4) {
                if (xhrPlayGame.status === 200) {
                    var jsonResponse = JSON.parse(xhrPlayGame.responseText);
                    if (jsonResponse.status === "OK") {
                        // La paraula és correcta
                        console.log("Paraula correcta. El jugador " + playData.player + " ha salvat la seva vida fins ara.");
                        if (playData.player === "P1" || playData.player === "P2") {
                            actualizarEstadoJuego(); // Realitzar sol·licitud d'actualització de l'estat del joc
                        }
                    } else {
                        // La paraula és incorrecta
                        console.log("Paraula incorrecta. El jugador " + playData.player + " perd una vida.");
                        // Actualitzar vides i mostrar a la interfície gràfica
                        lives--;
                        updateMonsterImage();
                        livesText.innerHTML = (lives + "<br> LIVES <br>LEFT");
                        if (lives === 0) {
                            alert("Has perdut la partida!");
                            document.body.removeEventListener("keydown", pressKey);
                        }
                    }
                } else {
                    console.error("Error en la sol·licitud AJAX: " + xhrPlayGame.status);
                }
            }
        };
        xhrPlayGame.send(JSON.stringify(playData));
    }

    // Funció per reiniciar el joc
    function restartGame() {
        window.location.reload();
    }

    // Funció per actualitzar l'estat del joc
    function updateGameState(response) {
        gameStatus = response.gameInfo;
        letters.innerHTML = gameStatus.wordCompleted;
    }

    // Funció per actualitzar l'estat del joc després de realitzar una jugada
    function actualizarEstadoJuego() {
        var xhrUpdateGame = new XMLHttpRequest();
        xhrUpdateGame.open("POST", "https://penjat.codifi.cat", true);
        xhrUpdateGame.setRequestHeader("Content-Type", "application/json");
        xhrUpdateGame.onreadystatechange = function () {
            if (xhrUpdateGame.readyState === 4 && xhrUpdateGame.status === 200) {
                var jsonResponse = JSON.parse(xhrUpdateGame.responseText);
                updateGameState(jsonResponse);
            }
        };
        xhrUpdateGame.send(JSON.stringify({ "action": "infoGame", "gameName": roomCode }));
    }

    function updateMonsterImage() {
        var imgMonstre = document.getElementById("monster");

        // Construir la ruta de la imagen en función del número de vidas
        var imagePath = "img/monster" + lives + ".png";

        // Actualizar la fuente de la imagen
        imgMonstre.src = imagePath;
    }

    // Función para realizar la solicitud AJAX y actualizar el estado del juego
    function actualizarEstadoJuegoPeriodicamente() {
        var xhrUpdateGame = new XMLHttpRequest();
        xhrUpdateGame.open("POST", "https://penjat.codifi.cat", true);
        xhrUpdateGame.setRequestHeader("Content-Type", "application/json");
        xhrUpdateGame.onreadystatechange = function () {
            if (xhrUpdateGame.readyState === 4 && xhrUpdateGame.status === 200) {
                var jsonResponse = JSON.parse(xhrUpdateGame.responseText);
                updateGameState(jsonResponse);
            }
        };
        xhrUpdateGame.send(JSON.stringify({ "action": "infoGame", "gameName": roomCode }));
    }

});
