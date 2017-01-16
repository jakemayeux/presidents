const HAND = document.querySelector('#hand')
const SERVER = 'http://localhost:3000'

var socket = io(SERVER)

class Card {
	constructor(rank, suit){
		rank++
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

new Card(1,1)

function toggleSelected(e){
	console.log(e)
}

function renderCards(cards){
	for(i of cards){
		new Card(i[0], i[1])
	}
}

socket.on('waiting for players', function(){
	document.getElementById('message').setAttribute('display', 'box')
})

socket.on('game start', function(){
	document.getElementById('message').setAttribute('display', 'none')
})

socket.on('get cards', function(cards){
	renderCards(cards)
	console.log(cards)
})
