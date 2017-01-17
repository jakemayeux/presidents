var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

class Deck {
	constructor(){
		this.deck = new Array()
		for(var r=0; r<13; r++){
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
const PTYPE = [ //play type
	'single',
	'double',
	'triple',
	'quadruple',
	'poker'
]

var ptype = 0
var gamestate = 0
var turn = 0
var lastplay = [[-1,-1]]
var table = new Array()

var players = new Array()
var deck = new Deck()

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html')
})

http.listen(3000, function(){
	console.log('listening on *:3000')
})

//-----------------------SOCKET HOOKS----------------------//
io.on('connection', function(socket){
	players.push({socket:socket, id:socket.id, hand:[], rank:null})
	console.log(players.length)

	socket.emit('get id', socket.id)

	if(gamestate == 0 && players.length >= MIN_PLAYERS){
		startGame()
	}else{
		socket.emit('waiting for players')
	}

	socket.on('disconnect', function(){
		disconnectPlayer(socket.id)
	})
	socket.on('disconnecting', function(){
		// disconnectPlayer(socket.id)
		console.log('disconnecting: '+socket.id)
	})
	socket.on('error', function(err){
		// disconnectPlayer(socket.id)
		console.log('error: '+socket.id)
		console.log(err)
	})

	socket.on('play cards', function(cards){
		phcid = socket.id
		if(!cards.every(playerHasCards)){
			socket.emit('invalid play')
			return
		}
		if(isValidPlay(cards, socket)){
			console.log('valid play')
			let pli = playerIndexById(phcid)
			for(card of cards){
				console.log('card', card)
				for(i in players[pli].hand){
					if(card[0] == players[pli].hand[i][0] && card[1] == players[pli].hand[i][1]){
						console.log(players[pli].hand.splice(i, 1))
						break
					}
				}
			}
			table.push(cards)
			socket.emit('get cards', players[pli].hand)
			updateClients()
		}

	})

	console.log('connected players: '+players.length)
})

//-----------------------FUNCTIONS--------------------------//
var phcid = 0
function playerHasCards(e,i,a){
	icecard = e
	// console.log('icecard', e)
	return players[playerIndexById(phcid)].hand.some(isCardEquivalent)
}

var icecard = [-1,-1]
function isCardEquivalent(e,i,a){
	// console.log('e', e)
	return icecard[0] == e[0] && icecard[1] == e[1]
}

function playerIndexById(id){
	for(i in players){
		if(id == players[i].id){
			console.log(i)
			return i
		}
	}
}

function isValidPlay(cards, socket){
	if(getPlayType(cards) != ptype){
		socket.emit('incorrect play type')
		return false
	}

	if(!isBetterPlay(cards)){
		socket.emit('not high enough')
		return false
	}

	return true
}

function isBetterPlay(cards){
	if(ptype == 0){
		if(isCardHigher(cards[0], lastplay[0])){
			return true
		}
	}else if(ptype == 1 || ptype == 2 || ptype == 3){
		let a = getHighCard(cards)
		let b = getHighCard(lastplay)
		if(!isCardHigher(a, b)){
			return false
		}
	}else if(ptype == 4){
		let a = getPokerRank(cards)
		let b = getPokerRank(lastplay)
		if(a < b){
			return false
		}if(a == b){
			a = getHighCard(cards, true)
			b = getHighCard(lastplay, true)
			if(!isCardHigher(a, b)){
				return false
			}
		}
	}
	return true
}

function getHighCard(cards, fullHouse){
	let ret = cards[0]

	if(fullHouse){
		let a = {r:-1,c:0,s:-1}
		let b = {r:-1,c:0,s:-1}
		for(i of cards){
			if(a == -1){
				a.r = i[0]
				a.s = i[1]
			}else if(b == -1){
				b.r = i[0]
				b.s = i[1]
			}

			if(a.r == i[0]){
				a.c++
				if(i[1] > a.s){
					a.s = i[1]
				}
			}else if(b.r == i[0]){
				b.c++
				if(i[1] > b.s){
					b.s = i[1]
				}
			}
		}
		if(a.c == 3){
			return [a.r,a.s]
		}else if(b.c == 3){
			return [b.r,b.s]
		}else{
			console.log('something went wrong')
		}
	}

	for(i of cards){
		if(isCardHigher(i, ret)){
			ret = i
		}
	}
	return ret
}

function isCardHigher(a, b){
	if(a[0] > b[0]){
		return true
	}else if(a[0] == b[0] && a[0] > b[0]){
		return true
	}else{
		return false
	}
}

function getPlayType(cards){
	if(cards.length == 1){
		return 0
	}else if(sameRank()){
		if(cards.length < 5){
			return cards.length-1
		}
	}else if(cards.length == 5){
		if(getPokerRank(cards) != -1){
			return 4
		}
	}else{
		return -1
	}
}

function sameRank(cards){
	for(i of cards){
	 if(i[0] !== cards[0][0])
		return false;
	 }
	 return true;
}

function sameSuit(cards){
	for(i of cards){
    if(i[1] !== cards[0][1])
    	return false;
    }
    return true;
}

function getPokerRank(cards){
	if(sameRank(cards)){
		if(sameSuit(cards)){
			return 3 //straight flush
		}
		return 0 //straight
	}else if(sameSuit(cards)){
		return 1 //flush
	}else{
		let r1 = -1
		let r2 = -1
		let x = 0
		for(i of cards){
			if(i[0] == r1){
				x++
			}else if(i[0] == r2){
				x--
			}else if(r1 == -1){
				r1 = i[0]
			}else if(r2 == -1){
				r2 = i[0]
			}else{
				return -1
			}
		}
		if(x == 1 || x == -1){
			return 2 //full house
		}else{
			return -1
		}
	}
}

//-----------------------GAME PROGRESSION-------------------//
function startGame(){
	io.emit('game start')
	console.log('game started')
	ptype = 0
	gamestate = 1

	for(x in players){
		let i = players[x]
		let a = deck.deck.length / players.length
		players[x].hand = deck.deck.slice(x*a, (x+1)*a)
		console.log('playersx hand', players[x].hand)
		i.socket.emit('get cards', players[x].hand)
	}

	let playersStatus = new Array()
	for(i of players){
		console.log('hand:', i.hand.length)
		playersStatus.push({id:i.id, handSize:i.hand.length})
	}
	io.emit('player hand size', playersStatus)

	// for(i in players){
	//
	// }

	io.emit('a players turn', players[turn].id)
}

function updateClients(){
	let playersStatus = new Array()
	for(i of players){
		playersStatus.push({id:i.id, handSize:i.hand.length})
	}
	io.emit('client update', {players:playersStatus, table:table})
}

//-------------------------SERVER SHIT----------------------------//
function disconnectPlayer(id){
	console.log('disconnected player '+id)
	for(i in players){
		if(players[i].id == id){
			players.splice(i, 1)
			break
		}
	}
}

//------------------------GAME LOGIC-----------------------------//

// var play = new Array()
//
//
//
//
//
