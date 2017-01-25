const HAND = document.querySelector('#hand')
const OTHERS = document.querySelector('#otherHands')
const SERVER = 'http://localhost:3000'
const MSG = document.querySelector('#message')
const SUBMIT = document.querySelector('#submit')
const QUEUE = document.querySelector('#queue')
const CLEAR = document.querySelector('#clear')
const PASS = document.querySelector('#pass')
const TOOLTIP = document.querySelector('#tooltip')
const TABLE = document.querySelector('#table')

var socket = io(SERVER)
var hand = new Array()
var id = 0
var players = new Array()

var ptype = 0
var lastplay = [-1,-1]

var pokerRank = 0
var queue = new Array()
var play = new Array()
var myRank = -1
var maxSelectable = -1
var turn = -1
var persistentMessage = ''
var passCards = 0

var table = new Array()

class Card {
	constructor(rank, suit, parent, classStr){
		if(!parent){
			parent = HAND
		}
		if(rank != null){
			rank += 2
			if(rank == 14){
				rank = 1
			}
		}

		this.ele = document.createElement('div')
		this.elc = document.createElement('div')
		this.ele.appendChild(this.elc)

		if(typeof(suit) == 'number'){
			switch(suit){
				case null:
					suit = ''
					break
				case 0:
					suit = 'clubs'
					break
				case 1:
					suit = 'diamonds'
					break
				case 2:
					suit = 'hearts'
					break
				case 3:
					suit = 'spades'
					break
			}
		}
		if(!!classStr){
			this.ele.className = classStr
		}else{
			this.ele.className = 'card rank'+rank+' '+suit
		}
		if(suit == null){
			this.elc.className = 'back'
		}else{
			this.elc.className = 'face'
		}


		parent.appendChild(this.ele).onclick = toggleSelected
	}
}

new Card(0,0)
new Card(9,3)
new Card(4,2)
new Card(12,2)

// new Card(8,2,TABLE)
// new Card(3,2,TABLE)
renderTable(lastplay)

//-----------------------ELEMENT BINDINGS---------------------//

CLEAR.onclick = clearQueue
SUBMIT.onclick = submitCard
PASS.onclick = pass

PASS.addEventListener('mouseenter', function(){
	tooltip('Pass')
})

PASS.addEventListener('mouseleave', function(){
	tooltip('')
})

SUBMIT.addEventListener('mouseenter', function(){
	tooltip('Play Hand')
})

SUBMIT.addEventListener('mouseleave', function(){
	tooltip('')
})

CLEAR.addEventListener('mouseenter', function(){
	tooltip('Clear')
})

CLEAR.addEventListener('mouseleave', function(){
	tooltip('')
})

MSG.addEventListener('webkitAnimationEnd', function(){
	MSG.classList.remove('animate')
})

//-------------------------FUNCTIONS-----------------------//
//-------------------------GAMEPLAY------------------------//

function pass(){
	socket.emit('play cards', [])
}

function submitCard(){
	if(SUBMIT.classList.contains('valid')){
		let q = parseQueue(queue)
		if(passCards > 0){
			socket.emit('pass cards', q)
		}else{
			socket.emit('play cards', q)
		}
	}
}

function toggleSelected(e){
	let card = e.target.parentElement
	if(queue.includes(card.className)){
		queue.splice(queue.indexOf(card.className), 1)
		document.querySelector('#hand .'+card.className.replace(/ /g, '.')).classList.remove('hidden')
	}else{
		queue.push(card.className)
		document.querySelector('#hand .'+card.className.replace(/ /g, '.')).classList.add('hidden')
	}
	renderQueue(queue)

	// let x = parseQueue

	// for(i in x){
	// 	// if()
	// }

	if(queue.length > 0){
		CLEAR.classList.add('valid')
	}else{
		CLEAR.classList.remove('valid')
	}

	if(isValidPlay(parseQueue(queue))){
		console.log('valid')
		SUBMIT.classList.add('valid')
	}else{
		SUBMIT.classList.remove('valid')
	}
}

//---------------------------RENDERING---------------------//
function clearQueue(){
	if(CLEAR.classList.contains('valid')){
		queue = new Array()
		for(i of document.querySelectorAll('#hand .hidden')){
			i.classList.remove('hidden')
		}
		renderQueue(queue)
	}
	SUBMIT.classList.remove('valid')
	CLEAR.classList.remove('valid')
}

function parseQueue(q){
	let ret = new Array()
	for(i of q){
		let r
		let s
		let a = i.split(' ')
		if(a.includes('clubs')){
			s = 0
		}else if(a.includes('diamonds')){
			s = 1
		}else if(a.includes('hearts')){
			s = 2
		}else if(a.includes('spades')){
			s = 3
		}else{
			s = -1
		}
		r = parseInt(a[1].substr(4))
		if(r == 1){
			r = 14
		}
		r -= 2
		ret.push([r,s])
	}
	console.log(ret)
	return ret
}

function renderQueue(cards){
	removeChildren(QUEUE)

	for(i of cards){
		new Card(null, true, QUEUE, i)
	}
}

function renderCards(cards){
	removeChildren(HAND)

	// hand = cards.sort(sortCards)
	hand = cards
	for(i of hand){
		new Card(i[0], i[1])
	}
}

function renderTable(cards){
	removeChildren(TABLE)
	if(cards.length == 0){
		return
	}
	if(cards[0] == -1){
		return
	}

	for(i of cards){
		new Card(i[0], i[1], TABLE)
	}
}

function renderPlayers(){
	removeChildren(OTHERS)
	for(i of players){
		let idv = document.createElement('div')
		for(let x=0; x<i.handSize; x++){
			new Card(null,null,idv)
		}
		OTHERS.appendChild(idv)
	}
}

//---------------------------LOGIC--------------------------//
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
	}
	return -1
}

function sameRank(cards){
	for(i of cards){
    if(i[0] != cards[0][0])
    	return false
    }
    return true
}

function sameSuit(cards){
	for(i of cards){
    if(i[1] !== cards[0][1])
    	return false
    }
    return true
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
			return 2
		}else{
			return -1
		}
	}
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

function message(str){
	MSG.innerText = str
	MSG.classList.add('animate')
}

function tooltip(str){
	TOOLTIP.innerText = str
}

function selectCards(stype){
	if(stype == -2){
		maxSelectable = 2
	}else if(stype == -1){
		maxSelectable = 1
	}
}

function isValidPlay(cards){
	if(passCards > 0){
		return cards.length == passCards
	}

	let gpt = getPlayType(cards)
	if(ptype == -1){
		if(gpt != -1){
			return true
		}else{
			return false
		}
	}else if(gpt != ptype){
		return false
	}

	if(!isBetterPlay(cards)){
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

//---------------------------SOCKET.IO---------------------//
socket.on('get id', function(id){
	//
})

socket.on('waiting for players', function(){
	// document.getElementById('waiting').style.display = ''
	message('Waiting for players to start the game')
})

socket.on('game start', function(){
	document.getElementById('waiting').style.display = 'none'
})

socket.on('get cards', function(cards){
	clearQueue()
	console.log('got cards')
	hand = cards
	renderCards(cards)
})

socket.on('game reset', function(){
	renderCards([])
	document.getElementById('waiting').style.display = 'none'
})

socket.on('player hand size', function(data){
	for(i of data){
		if(i.id == socket.id){
			continue
		}

		fidid = i.id
		let x = players.findIndex(findID)
		if(x == -1){
			players.push({id:i.id, handSize:i.handSize})
		}else{
			players[x].handSize = i.handSize
		}
	}
	renderPlayers()
})

socket.on('a players turn', function(id){
	if(socket.id == id){
		message('Your Turn')
		PASS.classList.add('valid')
	}else{
		message(id+"'s turn")
		PASS.classList.remove('valid')
	}
	turn = id
})

socket.on('invalid play', function(){
	console.log('invalid play')
})

socket.on('not high enough', function(){
	console.log('play higher cards')
})

socket.on('incorrect play type', function(){
	console.log('you must follow the play type')
})

socket.on('client update', function(data){
	for(i of data.players){
		if(i.id == socket.id){
			continue
		}

		fidid = i.id
		let x = players.findIndex(findID)
		if(x == -1){
			players.push({id:i.id, handSize:i.handSize})
		}else{
			players[x].handSize = i.handSize
		}
	}
	renderPlayers()
	table = data.table
	lastplay = data.table[data.table.length-1]
	if(typeof(lastplay) == 'undefined'){
		lastplay = [-1,-1]
		ptype = -1
	}else if(lastplay.length == 0){
		lastplay = [-1,-1]
		ptype = -1
	}else{
		ptype = getPlayType(lastplay)
	}
	renderTable(lastplay)
})

socket.on('get rank', function(data){
	if(data.id == socket.id){
		myRank = data.rank
	}

	fidid = data.id
	let x = players.findIndex(findID)
	players[x].rank = data.rank
})

socket.on('card passing phase', function(){
	message('card passing phase')
})

socket.on('pass 2', function(){
	message('Pass 2 Cards to the Asshole')
	passCards = 2
})

socket.on('pass 1', function(){
	message('Pass 1 Card to the Vice-Asshole')
	passCards = 1
})

socket.on('receive 2', function(){
	message('Waiting to Receive Cards from President')
})

socket.on('receive 1', function(){
	message('Waiting to Receive Card from Vice-President')
})

socket.on('receive pass', function(cards){
	message('Cards Received from Pass')
	hand.push(cards)
	hand.sort(sortCards)
	renderCards(hand)
})


var cidid = 0
function containsID(e,i,a){
	return e.id == cidid
}

var fidid = 0
function findID(e,i,a){
	return e.id == fidid
}

function removeChildren(e){
	while(e.hasChildNodes()){
		e.removeChild(e.lastChild)
	}
}
