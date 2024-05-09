document.addEventListener("DOMContentLoaded", function () {
    var gameStatus = {};
    var roomCode;
    var roomPassword = "XXX";  // Contraseña por defecto
    var playerRole = "P1";  // Por defecto, el primer jugador es P1
    var currentPlayer = "P1"; // Jugador que tiene el turno
    var pollingInterval;

    // Elementos de la UI que modificaremos
    var clueText = document.getElementById("clue").getElementsByTagName("span")[0];
    var livesText = document.getElementById("lives");
    var lettersDisplay = document.getElementById("letters");
    var monsterImage = document.getElementById("monster");

    var option = confirm("El Penjat Online\n\n- Unir-se a una sala → Acceptar.\n\n- Crear una sala → Cancelar.");
    if (option) {
        playerRole = "P2";  // El segundo jugador que se une es P2
        roomCode = prompt("Sala on et vols unir");
        joinGame(roomCode);  // Función para unirse a un juego existente
    } else {
        playerRole = "P1";  // El primer jugador que crea la sala es P1
        roomCode = prompt("Nom de la sala que vols crear");
        createGame(roomCode);  // Función para crear un nuevo juego
    }

    clueText.innerHTML = playerRole;  // Actualiza el rol del jugador en la interfaz

    function joinGame(room) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://penjat.codifi.cat", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.status === "OK") {
                    updateGameState(response);
                    startPolling();
                } else {
                    alert("Error: " + response.response);
                }
            }
        };
        xhr.send(JSON.stringify({ "action": "infoGame", "gameName": room }));
    }

    function createGame(room) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://penjat.codifi.cat", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.status === "OK") {
                    updateGameState(response);
                    startPolling();
                } else {
                    alert("Error al crear la sala: " + response.response);
                }
            }
        };
        xhr.send(JSON.stringify({ "action": "createGame", "gameName": room, "gamePassword": roomPassword }));
    }

    function updateGameState(response) {
        if (response.status === "OK" && response.gameInfo && response.gameInfo.wordCompleted) {
            gameStatus = response.gameInfo;
            lettersDisplay.innerHTML = gameStatus.wordCompleted;
            livesText.innerHTML = gameStatus["lives" + playerRole] + " LIVES LEFT";
            currentPlayer = response.player; // Actualizar el jugador actual
            updateMonsterImage(gameStatus["lives" + playerRole]);
        } else {
            alert("Error: " + (response.response || "Respuesta desconocida del servidor"));
        }
    }

    document.body.addEventListener("keydown", function (event) {
        if (currentPlayer !== playerRole) {
            alert("Espera tu turno.");
            return;
        }

        var key = event.key.toUpperCase();
        if (!/^[A-Z]$/i.test(key)) return;

        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://penjat.codifi.cat", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.status === "OK") {
                    updateGameState(response);
                } else {
                    updateLives(response);  // Actualiza las vidas y la UI si el movimiento falla
                    checkGameState();  // Verifica el estado del juego
                }
            }
        };
        xhr.send(JSON.stringify({ "action": "playGame", "gameName": roomCode, "word": key, "player": playerRole }));
    });

    function updateLives(response) {
        var livesKey = "lives" + playerRole;
        gameStatus[livesKey] -= 1;
        livesText.innerHTML = gameStatus[livesKey] + " LIVES LEFT";
        updateMonsterImage(gameStatus[livesKey]);
        if (gameStatus[livesKey] === 0) {
            alert("Game Over");
            window.location.reload(); // Recarga la página para reiniciar el juego
        }
    }

    function checkGameState() {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "https://penjat.codifi.cat", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                updateGameState(response);
            }
        };
        xhr.send(JSON.stringify({ "action": "infoGame", "gameName": roomCode }));
    }

    function startPolling() {
        pollingInterval = setInterval(checkGameState, 2000); // Verificar el estado del juego cada 2 segundos
    }

    function updateMonsterImage(lives) {
        var imgMonstre = document.getElementById("monster");
        var imagePath = "img/monster" + lives + ".png";
        imgMonstre.src = imagePath;
    }
});
