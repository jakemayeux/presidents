const HAND = document.querySelector('#hand')
const OTHERS = document.querySelector('#otherHands')
const SERVER = 'http://localhost:3000'

var socket = io(SERVER)
var hand = new Array()
var id = 0
var players = new Array()
var ptype = 0
var pokerRank = 0
var tempplay = new Array()
var play = new Array()
var myRank = -1

class Card {
	constructor(rank, suit, parent){
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
		this.ele.setAttribute('rank', rank)
		this.ele.setAttribute('suit', suit)
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
		this.ele.className = 'card rank'+rank+' '+suit
		if(suit == null){
			this.elc.className = 'back'
		}else{
			this.elc.className = 'face'
		}


		parent.appendChild(this.ele).onclick = toggleSelected
	}
}

new Card(0,0)
//-------------------------FUNCTIONS-----------------------//
//-------------------------GAMEPLAY------------------------//

function createPlay(hand){

}


function toggleSelected(e){
	let card = e.target.parentElement
	if(tempplay.some(card)){
		teampplay.slice(tempplay.indexOf(card))
	}else if(teamplay.some(card)){
		teampplay.push(card)
	}
}

//---------------------------RENDERING---------------------//
function renderCards(cards){
	removeChildren(HAND)

	// hand = cards.sort(sortCards)
	hand = cards
	for(i of hand){
		new Card(i[0], i[1])
	}
	console.log()
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
	}else if(a[0] == b[0] && a[0] > b[0]){
		return true
	}else{
		return false
	}
}


//---------------------------SOCKET.IO---------------------//
socket.on('get id', function(id){
	//
})

socket.on('waiting for players', function(){
	document.getElementById('waiting').style.display = ''
})

socket.on('game start', function(){
	document.getElementById('waiting').style.display = 'none'
})

socket.on('get cards', function(cards){
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
		console.log('your turn')
	}else{

	}
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
	console.log(data.table)
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

})

socket.on('pass 2', function(){
	//begin pass selection
})

socket.on('pass 1', function(){

})

socket.on('receive 2', function(){
	//darken and popup highest two cards to indicate pass
})

socket.on('receive 1', function(){

})

socket.on('receive pass', function(){

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
