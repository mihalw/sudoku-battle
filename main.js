(function init() {
  var yourName, yourScore = 0, opponentScore = 0;
  var roomId, boardIdx;
  var column, row;
  var board = [], resultBoard = [];

  var width = 60;
  var height = 60;
  var top, left;

  const socket = io.connect('http://localhost:5000');

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
      alert('Please enter your name!');
      return;
    }
    socket.emit('createGame', {});
  });

  $('#join').on('click', () => {
    yourName = $('#nameJoin').val();
    roomId = $('#room').val();
    if (!yourName || !roomId) {
      alert('Wprowadz swoja nazwe oraz ID pokoju.');
      return;
    }
    socket.emit('joinGame', { room: roomId });
  });

  socket.on('newRoom', (data) => {
    roomId = data.room;
    welcomePlayer(`Witaj ${yourName}! <br/> Nazwa pokoju to: ${data.room} <br/> Czekaj na drugiego gracza...`);
  });

  socket.on('newBattle', (data) => {
    board = data.board;
    resultBoard = data.resultBoard;
    boardIdx = data.boardIdx;
    createGameBoard(board);
    showPoints();
  });

  socket.on('updatedBoard', (data) => {
    board[data.indexNumber] = data.number;
    document.getElementById('sudoku').getContext('2d').fillText(data.number, data.left + 20, data.top + 40);
    if (data.player === yourName)
      yourScore++;
    else
      opponentScore++;
    $('#playersPoints').html(`${yourName}: ${yourScore} <br\> Przeciwnik: ${opponentScore}`);
  });

  socket.on('playerFailed', (data) => {
    if (data.player === yourName)
      yourScore--;
    else
      opponentScore--;
    $('#playersPoints').html(`${yourName}: ${yourScore} <br\> Przeciwnik: ${opponentScore}`);
  });

}());
