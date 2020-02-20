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
        var str = `room-${++rooms}`;
        var buf = new ArrayBuffer(str.length * 2);
        var bufView = new Uint16Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        socket.join(`room-${rooms}`);
        socket.emit('newRoom', buf);
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
    });

    socket.on('updateBoard', (data) => {
        var buf = new ArrayBuffer(8);
        var bufView = new Uint16Array(buf);
        bufView[0] = data.indexNumber;
        bufView[1] = data.number;
        bufView[2] = data.left;
        bufView[3] = data.top;
        var str = data.player;
        var buf2 = new ArrayBuffer(str.length * 2);
        var bufView2 = new Uint16Array(buf2);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView2[i] = str.charCodeAt(i);
        }
        io.sockets.in(data.room).emit('updatedBoard', { buf: buf, player: buf2 });
    });

    socket.on('failedUpdateBoard', (data) => {
        var str = data.player;
        var buf = new ArrayBuffer(str.length * 2);
        var bufView = new Uint16Array(buf);
        for (var i = 0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        io.sockets.in(data.room).emit('playerFailed', { player: buf });
    });
});

server.listen(process.env.PORT || 5000);