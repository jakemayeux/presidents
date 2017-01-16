var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

class Deck {
	constructor(){
		this.deck = new Array()
		for(var r=0; r<14; r++){
			for(var s=0; s<4; s++){
				this.deck.push([r,s])
			}
		}
		this.shuffle()
	}

	shuffle(){
		var j, x, i;
		for (i = this.deck.length; i; i--){
			j = Math.floor(Math.random() * i)
			x = this.deck[i - 1]
			this.deck[i - 1] = this.deck[j]
			this.deck[j] = x
		}
	}
}

const MIN_PLAYERS = 2
var gamestate = 0

var players = new Array()
var deck = new Deck()


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
})

http.listen(3000, function(){
	console.log('listening on *:3000')
})

io.on('connection', function(socket){
	players.push({socket:socket, id:socket.id})
	console.log(players.length)

	socket.emit('get id', socket.id)

	let dc = new Array()
	for(i of players){
		// console.log(io.sockets[i.id].status)
		console.log(socket.status)
		if(!i.socket.status){
			// dc.push(i.id)
		}
	}
	for(i of dc){
		disconnectPlayer(i)
	}

	if(gamestate == 0 && players.length >= MIN_PLAYERS){
		startGame()
	}else{
		socket.emit('waiting for players')
	}

	socket.on('disconnect', function(){
		disconnectPlayer(socket.id)
	})

	console.log('connected players: '+players.length)
})

function startGame(){
	console.log('game started')
	gamestate = 1
	for(i in players){
		let a = deck.deck.length / players.length
		players[i].hand = deck.deck.slice(i*a, (i+1)*a)
		players[i].socket.emit('get cards', players[i].hand)
	}

	let playersStatus = new Array()
	for(i in players){
		// playersStatus.push({id:i.id, handSize:i.hand.length})
	}
	io.emit('player hand size', playersStatus)
}

function disconnectPlayer(id){
	console.log('disconnected player '+id)
	for(i in players){
		if(players[i].id == id){
			players.splice(i, 1)
			break
		}
	}
}
