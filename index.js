const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

var rooms = 0;

var boards = [
    "209000300000076000000000905603000000000000032000410080040020807050000004010805000",
    "230040000400508900000020840040001030601000508080900060014060000002804006000090074",
    "010002008000004000008000004020000090000510030000093000500870000780000005006001400"];

var resultBoards = [
    "279584316531976428468231975683792541194658732725413689346129857852367194917845263",
    "238749615476518923159326847945681732621473598387952461514267389792834156863195274",
    "415932678962784153378165924823647591649518732157293846534876219781429365296351487"];

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

io.on('connection', (socket) => {

    socket.on('createGame', () => {
        socket.join(`room-${++rooms}`);
        socket.emit('newRoom', { room: `room-${rooms}` });
    });

    socket.on('connectExistingGame', (data) => {
        socket.join(data.room);
    });

    socket.on('joinGame', function (data) {
        var room = io.nsps['/'].adapter.rooms[data.room];
        if (room && room.length === 1) {
            socket.join(data.room);
            if (data.refresh == 0) {
                var boardIdx = getRandomInt(0, 3);
                io.sockets.in(data.room).emit('newBattle', {
                    room: data.room, board: Array.from(boards[boardIdx]),
                    resultBoard: Array.from(resultBoards[boardIdx]), boardIdx: boardIdx
                });
            }
        }
        else {
            console.log("Room is full :<");
        }
    });

    socket.on('updateBoard', (data) => {
        io.sockets.in(data.room).emit('updatedBoard', { indexNumber: data.indexNumber, number: data.number, left: data.left, top: data.top, player: data.player });
    });

    socket.on('failedUpdateBoard', (data) => {
        io.sockets.in(data.room).emit('playerFailed', { player: data.player });
    });

    socket.on('disconnect', function(){
        console.log('Disconnected');
    });
});

server.listen(process.env.PORT || 5000);