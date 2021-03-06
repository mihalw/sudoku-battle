(function init() {
  var yourName, yourScore = 0, opponentScore = 0;
  var roomId, boardIdx;
  var column, row, correctMoves = 0, requiredMoves = 0;
  var board = [], resultBoard = [];

  var width = 60;
  var height = 60;
  var top, left;
  var begin = 0, welcomeStage = 0;

  const socket = io.connect('http://localhost:5000');

  if (typeof (Storage) !== "undefined") {
    if (sessionStorage.counter > 0) {
      begin = sessionStorage.begin;
      welcomeStage = sessionStorage.welcomeStage;
      if (welcomeStage) {
        welcomeStage = sessionStorage.welcomeStage;
        yourName = sessionStorage.yourName;
        roomId = JSON.parse(sessionStorage.getItem("roomId"));
        welcomePlayer(`Witaj ${yourName}! <br/> Nazwa pokoju to: ${roomId} <br/> Czekaj na drugiego gracza...`);
        socket.emit('connectExistingGame', {room: roomId});
      }
      if (begin) {
        roomId = JSON.parse(sessionStorage.getItem("roomId"));
        socket.emit('joinGame', { room: roomId, refresh: sessionStorage.counter });
        board = JSON.parse(sessionStorage.getItem("board"));
        resultBoard = JSON.parse(sessionStorage.getItem("resultBoard"));
        yourName = sessionStorage.yourName; yourScore = sessionStorage.yourScore; opponentScore = sessionStorage.opponentScore;
        correctMoves = sessionStorage.correctMoves; requiredMoves = sessionStorage.requiredMoves;
        if (typeof yourScore === 'undefined') {
          yourScore = 0; opponentScore = 0, correctMoves = 0;
        }
        createGameBoard(board);
        showPoints();
      }
    }
    else {
      sessionStorage.counter = 1;
    }

  }

  document.getElementById('sudoku').addEventListener('click', function (event) {
    var elemLeft = document.getElementById('sudoku').offsetLeft, elemTop = document.getElementById('sudoku').offsetTop;
    var x = event.pageX - elemLeft, y = event.pageY - elemTop;

    for (row = 0; row < 9; row++)
      for (column = 0; column < 9; column++) {
        top = 20 + 60 * column;
        left = 20 + 60 * row;
        if (y > top && y < top + height
          && x > left && x < left + width) {
          return;
        }
      }
  }, false);

  document.addEventListener('keypress', function (event) {
    var keycode = event.keyCode;
    var input;
    if (keycode >= 49 && keycode <= 57)
      input = keycode - 48;
    else
      return;

    if (board[9 * row + column] == 0 && input == resultBoard[9 * row + column]) {
      socket.emit('updateBoard', {
        indexNumber: 9 * row + column, room: roomId, number: input, left: left, top: top, boardIdx: boardIdx,
        player: yourName
      });
    }

    if (board[9 * row + column] == 0 && input != resultBoard[9 * row + column]) {
      socket.emit('failedUpdateBoard', { room: roomId, player: yourName });
    }
  }, false);

  function createGameBoard(board) {
    var context = document.getElementById('sudoku').getContext('2d');
    $('.menu').css('display', 'none');
    $('.welcome').css('display', 'none');
    document.getElementById("sudoku").style = "display:inline;";
    context.font = "30px Arial";

    for (var i = 0; i < 9; i++)
      for (var j = 0; j < 9; j++) {
        top = 20 + 60 * j;
        left = 20 + 60 * i;
        context.fillStyle = 'white';
        context.fillRect(left, top, width, height);
        context.fillStyle = 'black';
        if (board[9 * i + j] != '0') {
          context.fillText(board[9 * i + j], left + 20, top + 40);
        }
        context.rect(left, top, 60, 60);
        context.strokeStyle = 'black';
        context.lineWidth = 1;
        context.stroke();
      }

    context.beginPath();
    context.rect(20, 20, 540, 540);
    context.rect(20, 200, 540, 180);
    context.rect(200, 20, 180, 540);
    context.lineWidth = 5;
    context.strokeStyle = "black";
    context.stroke();
  }

  function welcomePlayer(message) {
    $('.menu').css('display', 'none');
    $('.welcome').css('display', 'block');
    $('#userHello').html(message);
  }

  function showPoints() {
    $('.points').css('display', 'block');
    $('#playersPoints').html(`${yourName}: ${yourScore} <br\> Przeciwnik: ${opponentScore}`);
  }

  $('#new').on('click', () => {
    yourName = $('#nameNew').val();
    if (!yourName) {
      alert('Wprowadz swoj nick!');
      return;
    }
    sessionStorage.yourName = yourName;
    socket.emit('createGame', {});
  });

  $('#join').on('click', () => {
    yourName = $('#nameJoin').val();
    roomId = $('#room').val();
    if (!yourName || !roomId) {
      alert('Wprowadz swoja nazwe oraz ID pokoju.');
      return;
    }
    sessionStorage.yourName = yourName;
    socket.emit('joinGame', { room: roomId, refresh: 0 });
  });

  socket.on('newRoom', (data) => {
    roomId = String.fromCharCode.apply(null, new Uint16Array(data));
    sessionStorage.setItem('roomId', JSON.stringify(roomId));
    welcomePlayer(`Witaj ${yourName}! <br/> Nazwa pokoju to: ${roomId} <br/> Czekaj na drugiego gracza...`);
    welcomeStage = 1;
    sessionStorage.welcomeStage = welcomeStage;
  });

  socket.on('newBattle', (data) => {
    welcomeStage = 0;
    sessionStorage.welcomeStage = welcomeStage;
    begin = 1;
    sessionStorage.begin = begin;
    roomId = String.fromCharCode.apply(null, new Uint16Array(data.room));
    sessionStorage.setItem('roomId', JSON.stringify(roomId));
    board = new Uint16Array(data.board);
    sessionStorage.setItem("board", JSON.stringify(board));
    resultBoard = new Uint16Array(data.resultBoard);
    sessionStorage.setItem("resultBoard", JSON.stringify(resultBoard));
    boardIdx = new Uint16Array(data.boardIdx);
    sessionStorage.boardIdx = boardIdx;
    createGameBoard(board);
    showPoints();
    movesRequired();
  });

  socket.on('updatedBoard', (data) => {
    var buf = new Uint16Array(data.buf);
    board[buf[0]] = buf[1];
    sessionStorage.setItem("board", JSON.stringify(board));
    document.getElementById('sudoku').getContext('2d').fillText(buf[1], buf[2] + 20, buf[3] + 40);
    if (String.fromCharCode.apply(null, new Uint16Array(data.player)) === yourName) {
      yourScore++;
      correctMoves++;
    }
    else {
      opponentScore++;
      correctMoves++;
    }
    sessionStorage.yourScore = yourScore;
    sessionStorage.opponentScore = opponentScore;
    sessionStorage.correctMoves = correctMoves;
    $('#playersPoints').html(`${yourName}: ${yourScore} <br\> Przeciwnik: ${opponentScore}`);

    if (correctMoves == requiredMoves) {
      if (yourScore > opponentScore)
        alert("Wygrales!");
      if (yourScore < opponentScore)
        alert("Przegrales!");
      if (yourScore == opponentScore)
        alert("Remis!");
      sessionStorage.clear();
    }
  });

  socket.on('playerFailed', (data) => {
    if (String.fromCharCode.apply(null, new Uint16Array(data.player)) === yourName)
      yourScore--;
    else
      opponentScore--;
    sessionStorage.yourScore = yourScore;
    sessionStorage.opponentScore = opponentScore;
    $('#playersPoints').html(`${yourName}: ${yourScore} <br\> Przeciwnik: ${opponentScore}`);
  });

  function movesRequired() {
    for (var i = 0; i < 81; i++) {
      if (board[i] != resultBoard[i])
        requiredMoves++;
    }
    sessionStorage.requiredMoves = requiredMoves;
  }
}());
