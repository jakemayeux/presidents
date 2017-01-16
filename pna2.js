const SUIT = [
	'clubs',
	'diamonds',
	'hearts',
	'spades'
]

const FACE = {
	11:	'jack',
	12:	'queen',
	13:	'king',
	14:	'ace',
	15:	'2'
}

class Deck {
	constructor() {
		this.cards = new Array()
		for(var f=2; f<14; f++){
			for(var s=0; s<4; s++){
				this.cards.push(new Card(f,s))
			}
		}
	}

	function shuffle(){
		let a = this.cards
		let b = new Array()

		while(a.length > 0){

		}
	}
}

class Card {
	constructor(f, s){
		this.face = f
		this.suit = s
	}
}

function asdf(){
	let card = document.createElement('img')
	card.setAttribute('src', './card/1_1.png')
	document.body.appendChild(card)
}
asdf()



/*
var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight)
renderer.backgroundColor = 0x149E1D
renderer.resolution = window.devicePixelRatio
renderer.roundPixels = true

window.onresize = function(){
	renderer.resize(window.innerWidth, window.innerHeight)
}

document.body.appendChild(renderer.view)

var handCn = new PIXI.Container()
handCn.y = window.innerHeight/2
handCn.height = window.innerHeight/2

var cardSprites = {}

var loader = PIXI.loader

for(var f=1; f<14; f++){
	for(var s=1; s<5; s++){
		loader.add(f+'_'+s, './card/'+f+'_'+s+'.png')
	}
}

// loader.add('./card/whiteCard.png')

loader.load(function (loader, resources){
	for(var i in resources) {
		cardSprites[resources[i].name] = new PIXI.Sprite(resources[i].texture)

		if(Math.random() < 0.1){
			hand.push(cardSprites[resources[i].name])
		}
	}
	drawHand()
})

deck = new Deck()

var whiteCard = PIXI.Sprite.fromImage('./card/whiteCard.png')

var hand = new Array()
function drawHand(){
	let spacing = 20
	let scale = 0.5
	let height = 10
	let rendwidth = spacing*(hand.length-1) + whiteCard.width*scale
	let startx = window.innerWidth/2 - rendwidth/2
	let heightOffset = (window.innerHeight/2)-height-(cardSprites['1_1'].height*scale)
	let i
	let w
	for(let x in hand){
		i = hand[x]
		w = new PIXI.Sprite(whiteCard.texture)
		w.scale.x = w.scale.y = i.scale.x = i.scale.y = scale
		w.x=i.x = x*spacing + startx
		w.y=i.y = heightOffset

		handCn.addChild(w)
		handCn.addChild(i)
		console.log('asdf')
	}

	renderer.render(handCn)
}
*/
