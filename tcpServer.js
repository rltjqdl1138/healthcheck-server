
const net = require('net')
const tcpClient = require('./tcpClient')

class tcpServer {
	constructor(name, port, urls) {
		this.context = {
			port: port,
			name: name,
			urls: urls
		}
		this.merge = {}

		this.server = net.createServer((socket) => {
			//Client connect event
			this.onCreate(socket)

			//Error event 핸들러 등록
			socket.on('error', (exception) => {
				this.onClose(socket)
			})
			//Close event 핸들러 등록
			socket.on('close',() => {
				this.onClose(socket)
			})
			//Data event 핸들러 등록
			socket.on('data', (data) => {
				var key = socket.remoteAddress + ':' + socket.remotePort
				var sz = this.merge[key] ? this.merge[key] + data.toString() :
						data.toString()
				var arr = sz.split('¶')
				for (var n in arr) {
					if (sz.charAt(sz.length-1)!='¶' && n==arr.length-1){
						this.merge[key] = arr[n]
						break
					} else if(arr[n] == "") {
						break
					} else{
						this.onRead(socket, JSON.parse(arr[n]))
					}
				}
			})
		})	
		
		//Server Object's error
		this.server.on('error', (err)=>{
			console.log(err)
		})

		//Start Listening
		this.server.listen(port, () => {
			console.log('listen', this.server.address())
		})
	}
	
	//Create Connection Successfully
	onCreate(socket) {
		console.log("onCreate", socket.remoteAddress, socket.remotePort)
	}

	//Close Connection Successfully
	onClose(socket) {
		console.log("onClose", socket.remoteAddress, socket.remotePort)
	}


	//Distributor connect function
	connectToDistributor(host, port, callback) {
		var packet = {
			uri: "/distributes",
			method: "POST",
			key: 0,
			params: this.context	
		}
		var isConnectedDistributor = false
		this.clientDistributor = new tcpClient(
			host
			, port
			//Connect Event
			, (options) => {
				isConnectedDistributor = true
				this.clientDistributor.write(packet)
			}

			//Data Event
			, (options, data) => { callback(data) }

			//Connection close Event
			, (options) => { isConnectedDistributor = false }

			//Error Event
			, (options) => { isConnectedDistributor = false }
		)

		setInterval( () => {
			if (isConnectedDistributor != true){
				this.clientDistributor.connect()
			}
		}, 3000)
	}
}

module.exports = tcpServer