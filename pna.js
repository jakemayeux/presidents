const HAND = document.querySelector('#hand')
const OTHERS = document.querySelector('#otherHands')
const SERVER = 'http://localhost:3000'

var socket = io(SERVER)
var hand = new Array()
var id = 0
var players = new Array()

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
		// this.ele.setAttributeNode('onclick', 'window.toggleSelected()')
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
var tempplay = new Array()
var play = new Array()

function toggleSelected(e){
	let card = e.target.parentElement
	if(tempplay.some(card)){
		teampplay.slice(tempplay.indexOf(card))
	}else if(teamplay.some(card)){
		teampplay.push(card)
	}
}

function createPlay(hand){

}



//---------------------------RENDERING---------------------//
function renderCards(cards){
	removeChildren(HAND)

	hand = cards.sort(sortCards)
	for(i of hand){
		new Card(i[0], i[1])
	}
	console.log()
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

socket.on('get id', function(id){
	//
})

socket.on('waiting for players', function(){
	document.getElementById('message').style.display = ''
})

socket.on('game start', function(){
	document.getElementById('message').style.display = 'none'
})

socket.on('get cards', function(cards){
	hand = cards
	renderCards(cards)
})

socket.on('game reset', function(){
	renderCards([])
	document.getElementById('message').setAttribute('display', 'box')
})

socket.on('player hand size', function(data){
	for(i of data){
		if(i.id == socket.id){
			continue
		}

		fidid = i.id
		let x = players.find(findID)
		if(!x){
			players.push({id:i.id, handSize:i.handSize})
		}else{
			players[x].handSize = i.handSize
		}
	}
	renderPlayers()
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
