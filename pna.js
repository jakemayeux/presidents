const HAND = document.querySelector('#hand')
const SERVER = 'http://localhost:3000'

var socket = io(SERVER)
var hand = new Array()
var id = 0
var players = new Array()

class Card {
	constructor(rank, suit){
		rank += 2
		if(rank == 14){
			rank = 1
		}
		this.ele = document.createElement('div')
		this.elc = document.createElement('div')
		// this.ele.setAttributeNode('onclick', 'window.toggleSelected()')
		this.ele.appendChild(this.elc)

		if(typeof(suit) == 'number'){
			switch(suit){
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
		this.elc.className = 'face'


		HAND.appendChild(this.ele).onclick = toggleSelected
	}
}

new Card(0,0)

function toggleSelected(e){
	console.log(e)
}

function renderCards(hand){
	hand.sort(sortCards)
	for(i of hand){
		new Card(i[0], i[1])
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

socket.on('get id', function(id){

})

socket.on('waiting for players', function(){
	document.getElementById('message').setAttribute('display', 'box')
})

socket.on('game start', function(){
	document.getElementById('message').setAttribute('display', 'none')
})

socket.on('get cards', function(cards){
	hand = cards
	renderCards(cards)
})

socket.on('player hand size', function(data){
	for(i of data){
		if(i.id == socket.id){
			continue
		}

		cidid = i.id
		if(!players.some(containsID)){
			players[i.id] = {id:i.id, handSize:i.handSize}
		}else{
			players[i.id].handSize = i.handSize
		}
	}
	console.log(players)
})

var cidid = 0
function containsID(e,i,a){
	return e.id == cidid
}
