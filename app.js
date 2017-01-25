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

const MIN_PLAYERS = 3
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
var numOfPasses = 0

var numPlayersOut = 0

var rec2pli = -1
var rec1pli = -1

var waitingForPass = 0

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
	players.push({socket:socket, id:socket.id, hand:[], rank:-1})
	// console.log(players.length)

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
		console.log('error id: '+socket.id)
		console.log('error msg:', err)
	})

	socket.on('play cards', function(cards){
		if(cards.length == 0){
			console.log('passed')
			numOfPasses++
			nextTurn()
		}
		console.log('cards:', cards)
		phcid = socket.id
		if(!cards.every(playerHasCards)){
			socket.emit('invalid play')
			numOfPasses++
			nextTurn()
		}
		if(isValidPlay(cards, socket)){
			console.log('valid play')
			let pli = playerIndexById(phcid)
			for(card of cards){
				// console.log('card', card)
				for(i in players[pli].hand){
					if(card[0] == players[pli].hand[i][0] && card[1] == players[pli].hand[i][1]){
						players[pli].hand.splice(i, 1)
						break
					}
				}
			}
			table.push(cards)
			lastplay = cards
			socket.emit('get cards', players[pli].hand)
			if(players[pli].hand.length <= 0){
				players[pli].rank = numPlayersOut
				io.emit('get rank', {id:socket.id, rank:numPlayersOut})
				numPlayersOut++

				if(numPlayersOut >= players.length){
					newRound()
				}
			}
			numOfPasses = 0
			nextTurn()
			updateClients()
		}

	})

	socket.on('pass cards', function(cards){
		let pli = playerIndexById(socket.id)
		if(cards.length != 2 - players[pli].rank){
			return
		}
		if(players[pli].rank == 0){
			let acards = players[rec2pli].hand.splice(-2, 2)
			players[rec2pli].hand.push(cards)
			players[rec2pli].socket.emit('receive pass', cards)
			players[pli].hand.push(acards)
			players[pli].socket.emit('receive pass', acards)
		}else if(players[pli].rank == 1){
			let acards = players[rec1pli].hand.splice(-1, 1)
			players[rec1pli].hand.push(cards)
			players[rec1pli].socket.emit('receive pass', cards)
			players[pli].hand.push(acards)
			players[pli].socket.emit('receive pass', acards)
		}
		waitingForPass--
		if(waitingForPass == 0){
			startRound()
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
			// console.log(i)
			return i
		}
	}
}

function isValidPlay(cards, socket){
	let gpt = getPlayType(cards)
	if(gpt == -1){
		return false
	}
	console.log('play type: ', gpt)
	if(ptype == -1){
		ptype = gpt
		return true
	}else if(gpt != ptype){
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
			console.log(''+cards[0]+' is > than '+lastplay[0])
			return true
		}else{
			return false
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
	}else if(a[0] == b[0] && a[1] > b[1]){
		return true
	}else{
		return false
	}
}

function getPlayType(cards){
	if(cards.length == 1){
		return 0
	}else if(sameRank(cards)){
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

function sortCards(a,b){
	if(a[0]<b[0]){
		return -1
	}else if(b[0]<a[0]){
		return 1
	}else	if(a[1]<b[1]){
		return -1
	}else if(b[1]<a[1]){
		return 1
	}
}

//-----------------------GAME PROGRESSION-------------------//
function startGame(){
	io.emit('game start')
	console.log('game started')
	ptype = 0
	gamestate = 1

	dealCards()
	startRound()
}

function dealCards(){
	let a = deck.deck.length / players.length
	console.log(a)
	for(x in players){
		let i = players[x]
		players[x].hand = deck.deck.slice(x*a, (parseInt(x)+1)*a).sort(sortCards)
		i.socket.emit('get cards', players[x].hand)
	}

	let playersStatus = new Array()
	for(i of players){
		console.log('hand:', i.hand.length)
		playersStatus.push({id:i.id, handSize:i.hand.length})
	}
	io.emit('player hand size', playersStatus)
}

function startRound(){
	gamestate = 1
	io.emit('a players turn', players[turn].id)
}

function updateClients(){
	let playersStatus = new Array()
	for(i of players){
		playersStatus.push({id:i.id, handSize:i.hand.length})
	}
	io.emit('client update', {players:playersStatus, table:table})
}

function nextTurn(){
	turn++
	if(turn > players.length-1){
		turn = 0
	}
	if(players[turn].hand.length == 0){
		numOfPasses++
		console.log('next turn')
		nextTurn()
	}
	if(numOfPasses >= players.length-1){
		console.log('new trick')
		newTrick()
	}
	console.log('turn', turn)
	io.emit('a players turn', players[turn].id)
}

function newTrick(){
	ptype = -1
	table = new Array()
	numOfPasses = 0
	updateClients()
}

function newRound(){
	dealCards()
	numPlayersOut = 0
	gamestate = 2 //card passing phase
	io.emit('card passing phase')
	waitingForPass = 0
	for(x in players){
		let i = players[x]
		if(i.rank == 0){
			i.socket.emit('pass 2')
			waitingForPass++
		}else if(i.rank == 1 && players.length > 3){
			i.socket.emit('pass 1')
			waitingForPass++
		}else if(i.rank == players.length-1){
			i.socket.emit('receive 2')
			rec2pli = x
		}else if(i.rank == players.length-2 && players.length > 3){
			i.socket.emit('receive 1')
			rec1pli = x
		}
	}
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
