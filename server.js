"use strict";

var express    = require("express");
var bodyParser = require("body-parser");
var Storage = require('MongoDB');
var aiInterface = require("./aiInterface");
var game = require('./game');
var app = express();
var db = new Storage(null, null, 'group7');
// use the parse to get JSON objects out of the request. 
app.use(bodyParser.json());
// server static files from the public/ directory.
app.use(express.static('public'));


var board = {
    size:null,
    color:null,
    handicap: null,//always 4 tokens set to player 1 or 2
    mode: null // 2 is hot seat, 1 is play agianst AI
}
var player1 = {username : null,  type : null};//type could be guest/ai
var player2 = {username : null,  type : null};
var count = 0;
var pass = 0;
var boardState = {board : null, size : 0}; 
var oldBoard1 = [];
var oldBoard2 = [];
var lastMove = {x : 0, y : 0, c : 0, pass:false}; 
var islegal = null;
var turn = {type: null, c : 1};// start with player 1, alternative change between 1 and 2
function generateBoard(){

    var state = {
        size : 0, 
        board  : [],
    }
    state.size = board.size;

    var tmp = []; 
    for(var i = 0; i < state.size; i++){
        tmp = []; 
        for(var j = 0; j < state.size; j++){
            tmp.push(0); 
        }
        state.board.push(tmp); 
    }
    // var tmp1 = []; 
    // for(var i = 0; i < state.size; i++){
    //     tmp1 = []; 
    //     for(var j = 0; j < state.size; j++){
    //         tmp1.push(0); 
    //     }
    //     oldBoard1.push(tmp1); 
    // }
    // var tmp2 = []; 
    // for(var i = 0; i < state.size; i++){
    //     tmp2 = []; 
    //     for(var j = 0; j < state.size; j++){
    //         tmp2.push(0); 
    //     }
    //     oldBoard2.push(tmp2); 
    // }
    setHandi(state.board);
    for (var i = 0; i < state.size; i++){
    oldBoard2[i] = state.board[i].slice();
    oldBoard1 [i]= state.board[i].slice();

    }
    // setHandi(oldBoard1);
    // setHandi(oldBoard2);
    // state.board[1][1] = 6;
    // console.log(state.board);;
    // console.log(oldBoard1);
    // console.log(oldBoard2);
    return state; 
}

function setHandi(arr){
if(board.handicap == 1 ){
        if(board.size == 9){
            arr[2][2] = 1;
            arr[2][6] = 1;
            arr[6][2] = 1;
            arr[6][6] = 1;

        }
        if(board.size == 13){
            arr[3][3] = 1;
            arr[3][9] = 1;
            arr[9][3] = 1;
            arr[6][6] = 1;
        }
        if(board.size == 19){
            arr[3][3] = 1;
            arr[3][15] = 1;
            arr[15][3] = 1;
            arr[15][15] = 1;
        }


    }
     if(board.handicap == 2 ){
        if(board.size == 9){
            arr[2][2] = 2;
            arr[2][6] = 2;
            arr[6][2] = 2;
            arr[6][6] = 2;
        }
        if(board.size == 13){
            arr[3][3] = 2;
            arr[3][9] = 2;
            arr[9][3] = 2;
            arr[6][6] = 2;
        }
        if(board.size == 19){
            arr[3][3] = 2;
            arr[3][15] = 2;
            arr[15][3] = 2;
            arr[15][15] = 2;
        }

    }
}



/**
 * Handle a request for task data.
 */
app.get("/initBoard", function (req, res) {
    console.log("GET Request to: /initBoard");
    boardState = generateBoard();
    res.json(boardState); 
});
app.get("/board", function (req, res) {
    console.log("GET Request to: /board");
    res.json(board); 
});
app.get("/accounts", function (req, res) {
    console.log("GET Request to: /accounts");
    
     db.getAllAccounts(function(err, data){
         if(err){
            res.status(500).send();
        }else{
            res.status(200).json(data);
        } 
     });   
});
// app.get("/isLegal", function (req, res) {
//     console.log("GET Request to: /isLegal");
//     res.json(islegal); 
// });
app.get("/move", function (req, res) {
    console.log("GET Request to: /move");
    res.json(boardState);
});

app.get("/aiMove", function (req, res) {
    console.log("GET Request to: /aiMove");
    getAiMove();
    res.json(boardState);
});
app.get("/turn", function (req, res) {
    console.log("GET Request to: /turn");
   
    if(board.mode == 1 && turn.c == 2){
        console.log("aiaiaiaiaiia");
        turn.type = "ai";
    }else{
        turn.type = "player";
    }
    console.log(turn);
    res.json(turn);
});

app.get("/finish", function (req, res) {
    console.log("GET Request to: /finish");
    res.json(pass);
});

app.get("/score", function (req, res) {
    console.log("GET Request to: /score");
    var score  = game.countScore(boardState.board);
    res.json(score);
});


app.post("/mode", function (req, res) {
    board.mode = req.body.mode;
    console.log("Post Request to: /mode");
    console.log(board);
    res.status(200).send();
});

app.post("/size", function (req, res) {
    console.log("Post Request to: /size");
    var size = req.body;
    board.size = size.size;
    res.status(200).send();
});
app.post("/color", function (req, res) {
    console.log("Post Request to: /color");
    var color = req.body;
    board.color = color.color;
    res.status(200).send();
});
app.post("/handi", function (req, res) {
    console.log("Post Request to: /handi");
    var handi = req.body;
    board.handicap = handi.handi;
    res.status(200).send();
});

app.post("/addAccount", function (req, res) {

    console.log("POST Request to: /addAccount");
    
    db.addAcccount(req.body, function(err){
        if(err){
            res.status(500).send();
        }else{
            res.status(200).send();
        }
    });
    
    res.status(200).send();
});

app.post("/placeMove", function (req, res) {
    console.log("POST Request to: /placeMove");
    var tempMove = req.body;
    for(var i = 0; i < board.size; i++){
        oldBoard1[i] = oldBoard2[i].slice();
        
    }
    for(var i = 0; i < board.size; i++){
        oldBoard2[i] = boardState.board[i].slice();
    }

    console.log(oldBoard1);
    console.log(oldBoard2);
    if(tempMove.pass == true){
        console.log("bbbbbbbbbbb");
        lastMove.pass = true;
        pass++;
        count++;
        if(turn.c == 1 ){
                turn.c ==2;
        }else{
                 turn.c = 1;
        }
        res.status(200).send();  
    }else if(pass<2){
        console.log("ccccccc");
        pass = 0;
        var newBoard = game.PlayMove(oldBoard1,oldBoard2,tempMove.x,tempMove.y,tempMove.c);
        if(newBoard.Played == true || count < 4){
            console.log("dddddddd");
            count++;
            lastMove.x = tempMove.x;
            lastMove.y = tempMove.y;
            lastMove.c = tempMove.c;
            lastMove.pass = false;
            for(var i = 0; i < board.size; i++){
                    boardState.board[i] = newBoard.Board[i].slice();
            }
            if(turn.c == 1){
                turn.c =2;
            }else{
                 turn.c = 1;
            }   
            res.status(200).send(); 
        }else{
            res.status(403).send();  
        }
    }

    // }else if(pass>1){
    //     res.JSON()

    // }
});
app.post("/players", function (req, res) {

    console.log("POST Request to: /players");
    var temp = req.body;
    console.log(temp);
    player1.username = temp[0].username;
    player1.type = temp[0].type;
    player2.username = temp[1].username;
    player2.type = temp[1].type;
    res.status(200).send();
});

app.post("/account", function (req, res){
     db.updateAccount(req.body, function(err){
        if(err){
            res.status(500).send();
        }else{
            res.status(200).send();
        }
    });
});
app.listen(process.env.PORT || 3000, function () {
    console.log("Listening on port 3000");
});

function getAiMove(){ 
     console.log("inside of getAimove");
    aiInterface.getRandomMove(boardState.size, boardState.board, lastMove, function(move){
        console.log("inside of getAimove2222");
    for(var i = 0; i < board.size; i++){
        oldBoard1[i] = oldBoard2[i].slice();
        
    }
    for(var i = 0; i < board.size; i++){
        oldBoard2[i] = boardState.board[i].slice();
    }

    console.log(oldBoard1);
    console.log(oldBoard2);
    if(move.pass == true){
        console.log("bbbbbbbbbbb");
        lastMove.x = 0;
        lastMove.y = 0;
        lastMove.c = 0;
        lastMove.pass = true;
        pass++;
        count++;
        if(turn.c == 1 ){
                turn.c =2;
        }else{
                 turn.c = 1;
        }
    }else if(pass<2){
        console.log("ccccccc");
        pass = 0;
        var newBoard = game.PlayMove(oldBoard1,oldBoard2,move.x,move.y,move.c);
        if(newBoard.Played == true || count < 2){
            console.log("dddddddd");
            count++;
            lastMove.x = move.x;
            lastMove.y = move.y;
            lastMove.c = move.c;
            lastMove.pass = false;
            for(var i = 0; i < board.size; i++){
                    boardState.board[i] = newBoard.Board[i].slice();
            }
            if(turn.c == 1){
                turn.c = 2;
            }else{
                 turn.c = 1;
            }   
            
        }else{
             if(turn.c == 1){
                turn.c = 2;
            }else{
                 turn.c = 1;
            }   
            
            getAimove();
        }
    }
    });
}
