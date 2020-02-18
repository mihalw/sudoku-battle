const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

let rooms = 0;
var pointsPlayer1 = 0;
var pointsPlayer2 = 0;

var boards = [
    "070020000000900700002104090000010500600089004031500860005400600400800002080050000",
    "040009100000100700000005826005010903900006000001500060018204000002000007600080000",
    "000048900000300700004001538007030609000095003001000070020803400405000000830000000",
    "050082700000600200002000593005020001100068007000300020040003800509000002260010000",
    "068059000070000500009000040000080005750023004003500000000900107800030096030060000",
    "820040073000000000006935200630000095400802001980000027003789600000000000160020084",
    "070020090002090600010408050700602004800000007200701009090804020008010400040030010",
    "080701090907000301040030070800000004400298005200000006020010050508000103030405020",
    "170050068800601002000020000503000804060204010201000906000010000300406009410030057",
    "050060090001000400046291570980000024000805000630000015027154980009000300060020040",
    "010804070400306005003050600830000094200605007150000026004010800300207001020403060",
    "420080071008000300006702500380000054000407000570000092007201800002000400930060017",
    "050000060006000200040163070800407005000090000100602007090825010008000900060000080",
    "070000030005000600010354020160908072900000003540702016030627050004000300050000080",
    "630020095000000000009304200420000061010605020950000073003207600000000000240090038",
    "080000030006010700027306180000703000500891006000405000045109360003040200060000090",
    "807409603401000809000080000004607300603000407005804200000070000709000506508306902",
    "020104080001809300000020000004302600207000103009607200000070000003401500070905040",
    "087000690006070100000695000004908700300040001002107800000762000005010200029000370",
    "009000700078302140000479000801507302060000090205906804000684000026703410007000900",
    "012306940000000000706050108200080003300407001600020004907040306000000000023608750",
    "030090080009328600000604000803000506024000190501000304000405000005263800060070050",
    "005107300800602004000090000208000406100000007406000509000080000300201005001305700",
    "075000980009268500000070000506000709004501300908000105000030000007654200051000490",
    "501702030043000070000001000000300052004000600830007000000600000020000940050408306",
    "003009020012005400009001008900800000508000906000002004300100700005400680070900100",
    "008301290005007040000000000500106030204000708070402006000000000090700300027904500",
    "901400080078001050000003000710500003005000900400006025000600000030100840090004102",
    "001006500090002000060009001800700093000000000910008005600800020000300050005900700",
    "005401070746005010000007002000002060602000403010600000200300000050700926060908100",
    "109803240002006030000009006000000005701000304800000000200300000010600800098201703",
    "005002400047000030000007002600805000008000100000604009500100000080000670001400900",
    "908507000704006010003001000100900003006000100300004002000100500070400301000203704",
    "605203740900007020002000005400500009000000000500006002100000400080400003094805207",
    "009208040583000020002007000000102060007000300030704000000800600070000491060405800",
    "400002650267005900005009000900800006003000400600001007000200300006900145019300008",
    "900700140073002000004006000400000000702000306000000008000900700000300280028007005"];

app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

io.on('connection', (socket) => {

    // Create a new game room and notify the creator of game.
    socket.on('createGame', (data) => {
        socket.join(`room-${++rooms}`);
        socket.emit('newRoom', { name: data.name, room: `room-${rooms}` });
    });

    // Connect the Player 2 to the room he requested. Show error if room full.
    socket.on('joinGame', function (data) {
        var room = io.nsps['/'].adapter.rooms[data.room];
        if (room && room.length === 1) {
            socket.join(data.room);
            io.sockets.in(data.room).emit('newBattle', { room: data.room, board: boards[1] });
        }
        else {
            socket.emit('err', { message: 'Sorry, The room is full!' });
        }
    });

    /**
       * Handle the turn played by either player and notify the other.
       */
    socket.on('updateBoard', (data) => {
        io.sockets.in(data.room).emit('updatedBoard', { data });
    });

    /**
       * Notify the players about the victor.
       */
    socket.on('gameEnded', (data) => {
        socket.broadcast.to(data.room).emit('gameEnd', data);
    });
});

server.listen(process.env.PORT || 5000);