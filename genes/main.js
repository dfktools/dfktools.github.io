const rpc = 'https://api.harmony.one'
var _id = 1
const _class = {
    0: 'Warrior',
    1: 'Knight',
    2: 'Thief',
    3: 'Archer',
    4: 'Priest',
    5: 'Wizard',
    6: 'Monk',
    7: 'Pirate',
    16: 'Paladin',
    17: 'DarkKnight',
    18: 'Summoner',
    19: 'Ninja',
    24: 'Dragoon',
    25: 'Sage',
    28: 'DreadKnight'
}
const professions = {
    0: 'mining',
    2: 'gardening',
    4: 'fishing',
    6: 'foraging',
}

async function eth_call(data) {
	j = {
        'jsonrpc':'2.0',
        'method':'eth_call',
        'params':[data, 'latest'],
        'id':_id
    }
	_id += 1
	const response = await fetch(rpc, {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify(j)
	})
	const r = await response.json()
	return r['result']
}

async function userInfo(address) {
	data = {
		'to':'0x986c14726E824a28b5Ed4b0EdE8310fe491085C7',
		'data':'0x6386c1c7' + address.slice(2).toLowerCase().padStart(64, '0')
	}
	return await eth_call(data)
}

function decode(genes) {
	const abc = '123456789abcdefghijkmnopqrstuvwx'
	let buf = ''
	let base = 32n
	let mod = 0
	while (genes >= base) {
		mod = genes % base
		buf += abc[mod]
		genes = (genes - mod) / base
	}
	buf += abc[mod]
	buf = buf.padEnd(48, '1')
	let result = []
	for (let i = 0; i < buf.length; i++) result[i] = abc.indexOf(buf[i])
	return result
}

function parseRaw(rawString) {
	let raw = []
	for (let i = 0; i < rawString.length; i+=64) {
		if ((raw.length % 4) == 3) raw.push(BigInt('0x'+rawString.slice(i, i+64)))
		else raw.push(parseInt(rawString.slice(i, i+64), 16))
	}
	let heroes = []
	for (let i = 0; i < raw[1]; i++) {
		let j = 4*i + 2
		let t = decode(raw[j+1])
		let h = {
			'id':raw[j],
			'gen':raw[j+2],
			'rarity':raw[j+3],
			'mainClass':[
				_class[t[44]],
				_class[t[45]],
				_class[t[46]],
				_class[t[47]]
			],
			'subClass':[
				_class[t[40]],
				_class[t[41]],
				_class[t[42]],
				_class[t[43]]
			],
			'profession':[
				professions[t[36]],
				professions[t[37]],
				professions[t[38]],
				professions[t[39]]
			]
		}
		heroes.push(h)
	}
	heroes.sort((a, b) => a['id'] - b['id'])
	return heroes
}

async function go() {
	const address = document.getElementById('address-input').value
	if (address.length != 42) return
	localStorage.setItem('address', address)
	const rawString = (await userInfo(address)).slice(2)
	const heroes = parseRaw(rawString)
	displayHeroes(heroes)
}

function clearMain() {
	let main = document.getElementById('main')
	if (main) main.remove()
}

function addLabel(hb, text) {
	let a = document.createElement('label')
	a.setAttribute('class', text)
	a.innerHTML = text
	hb.appendChild(a)
}

function addHero(h) {
	let hb = document.createElement('div')
	hb.setAttribute('class', `hb-${h['rarity']}`)
	
	let items = [`#${h['id']} (G${h['gen']})`, 'D', 'R1', 'R2', 'R3', 'Class']
	items = items.concat(h['mainClass'])
	items.push('SubClass')
	items = items.concat(h['subClass'])
	items.push('Profession')
	items = items.concat(h['profession'])
	items.forEach(i => addLabel(hb, i))
	document.getElementById('main').appendChild(hb)
}

function displayHeroes(heroes) {
	clearMain()
	const main = document.createElement('div')
	main.setAttribute('id', 'main')
	document.body.appendChild(main)
	heroes.forEach(h => addHero(h))
}

window.addEventListener('load', async function () {
	document.getElementById('go-button').onclick = go
	let a = localStorage.getItem('address')
	if (a) {
		document.getElementById('address-input').value = a
		await go()
	}
})