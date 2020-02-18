(function init() {
  var player1Name, player2Name;
  var roomId;
  var column, row;
  var elements = [], board = [];

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
    switch (keycode) {
      case 49:
        input = 1;
        break;
      case 50:
        input = 2;
        break;
      case 51:
        input = 3;
        break;
      case 52:
        input = 4;
        break;
      case 53:
        input = 5;
        break;
      case 54:
        input = 6;
        break;
      case 55:
        input = 7;
        break;
      case 56:
        input = 8;
        break;
      case 57:
        input = 9;
        break;
      default:
        return;
    }
    if (elements[9 * row + column] == 0) {
      //document.getElementById('sudoku').getContext('2d').fillText(input, left + 20, top + 40);
      elements[9 * row + column] = input;
      socket.emit('updateBoard', {indexNumber: 9*row + column, room: roomId, number: input, left: left, top: top});
    }
  }, false);

  function welcomePlayer(message) {
    $('.menu').css('display', 'none');
    $('.welcome').css('display', 'block');
    $('#userHello').html(message);
  }

  function createGameBoard(board) {
    var context = document.getElementById('sudoku').getContext('2d');

    $('.menu').css('display', 'none');
    $('.welcome').css('display', 'none');
    document.getElementById("sudoku").style = "display:inline;";
    context.font = "30px Arial";

    for (var i = 0; i < 9; i++)
      for (var j = 0; j < 9; j++) {
        elements.push(board[9 * i + j]);
      }

    for (var i = 0; i < 9; i++)
      for (var j = 0; j < 9; j++) {
        top = 20 + 60 * j;
        left = 20 + 60 * i;
        context.fillStyle = 'white';
        context.fillRect(left, top, width, height);
        context.fillStyle = 'black';
        if (elements[9 * i + j] != '0') {
          context.fillText(elements[9 * i + j], left + 20, top + 40);
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

  // Create a new game. Emit newGame event.
  $('#new').on('click', () => {
    player1Name = $('#nameNew').val();
    if (!player1Name) {
      alert('Please enter your name!');
      return;
    }
    socket.emit('createGame', { name: player1Name });
  });

  // Join an existing game on the entered roomId. Emit the joinGame event.
  $('#join').on('click', () => {
    player2Name = $('#nameJoin').val();
    roomId = $('#room').val();
    if (!player2Name || !roomId) {
      alert('Wprowadz swoja nazwe oraz ID pokoju.');
      return;
    }
    socket.emit('joinGame', { name: player2Name, room: roomId });
  });

  // New Room created by current client. Update the UI.
  socket.on('newRoom', (data) => {
    const message = `Witaj, ${data.name}. Nazwa pokoju to: ${data.room}. Czekaj na drugiego gracza...`;
    roomId = data.room;
    welcomePlayer(message);
  });

  socket.on('newBattle', (data) => {
    board = data.board;
    createGameBoard(data.board);
  });

  socket.on('updatedBoard', (data) => {
    board[data.indexNumber] = data.number;
    document.getElementById('sudoku').getContext('2d').fillText(data.number, data.left + 20, data.top + 40);
  });

}());
