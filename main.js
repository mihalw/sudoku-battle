(function init() {
  var player1Name, player2Name, player1Points = 0, player2Points = 0;
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
      socket.emit('updateBoard', {indexNumber: 9*row + column, room: roomId, number: input, left: left, top: top, boardIdx: boardIdx,
      player1Name: player1Name, player2Name: player2Name});
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

  function showPoints(player1Points, player2Points) {
    $('.points').css('display', 'block');
    $('#playersPoints').html(`${player1Name}: ${player1Points} <br\> ${player2Name}: ${player2Points}`);
  }

  $('#new').on('click', () => {
    player1Name = $('#nameNew').val();
    if (!player1Name) {
      alert('Please enter your name!');
      return;
    }
    socket.emit('createGame', { name: player1Name });
  });

  $('#join').on('click', () => {
    player2Name = $('#nameJoin').val();
    roomId = $('#room').val();
    if (!player2Name || !roomId) {
      alert('Wprowadz swoja nazwe oraz ID pokoju.');
      return;
    }
    socket.emit('joinGame', { name: player2Name, room: roomId });
  });

  socket.on('newRoom', (data) => {
    roomId = data.room;
    welcomePlayer(`Witaj ${data.name}! <br/> Nazwa pokoju to: ${data.room} <br/> Czekaj na drugiego gracza...`);
  });

  socket.on('newBattle', (data) => {
    board = data.board;
    resultBoard = data.resultBoard;
    boardIdx = data.boardIdx;
    createGameBoard(board);
    showPoints(player1Points, player2Points);    
  });

  socket.on('updatedBoard', (data) => {
    board[data.indexNumber] = data.number;
    document.getElementById('sudoku').getContext('2d').fillText(data.number, data.left + 20, data.top + 40);
    if (data.player === player1Name && typeof data.player1Name === "undefined")
      player1Points++;
    else
      player2Points++;
      $('#playersPoints').html(`${player1Name}: ${player1Points} <br\> ${player2Name}: ${player2Points}`);
  });

}());
