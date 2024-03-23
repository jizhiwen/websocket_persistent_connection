var camera
var radar
var ws
var port
var url = 'ws://127.0.0.1:8080'

// Websocket 心跳对象
var heartBeat = {
    timeout: 5000,
    heartBeatTimer: null,
    reset: true,
    start: () => {
        if (heartBeat.heartBeatTimer != null) {
            return
        }
        heartBeat.heartBeatTimer = setInterval(() => {
            if (heartBeat.reset)
            {
                ws.close()
                createWsSession(url)
            }

            if (ws.readyState == WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    evt: 0 // heart beat
                }))
            }

            heartBeat.reset = true
        }, heartBeat.timeout)
    },
    stop: () => {
        clearInterval(heartBeat.heartBeatTimer)
    },
    update: () => {
        heartBeat.reset = false
    }
}

// 创建Websocket, 注册响应方法
createWsSession(url)

function createWsSession(url) {    
    console.log('[' + Date() + '] ' + 'connect to ' + url)
    ws = new WebSocket(url)
    heartBeat.start()

    ws.onopen = function () {
        console.log('[' + Date() + '] ' + 'connecte to ' + url + ' successfully!')
        heartBeat.update()
    }

    ws.onclose = function () {
        console.log('[' + Date() + '] ' + 'websocket closed already!')
    }

    ws.onerror = function () {
        console.log('[' + Date() + '] ' + 'websocket error!')
    }

    ws.onmessage = function (event) {
        OnHandleWsMessage(JSON.parse(event.data))
    }
}

function OnHandleWsMessage(msg) {
    heartBeat.update()
    switch (msg.evt) {
        case 0:
            console.log('[' + Date() + '] ' + 'heart beat !!!')
            break;
        case 1: //camera
            camera = msg.body;
            break;
        case 2: //radar
            radar = msg.body;
            break;
        default:
            break;
    }

    if ('undefined' != typeof (port)) {
        port.postMessage({ evt: msg.evt, body: msg.body })
    }
}

function strWsState(state) {
    switch (state) {
        case WebSocket.CONNECTING:
            return 'CONNECTING'
        case WebSocket.OPEN:
            return 'OPEN'
        case WebSocket.CLOSING:
            return 'CLOSING';
        case WebSocket.CLOSED:
            return 'CLOSED'
        default:
            return 'undefined'
    }
}

// Web Worker 注册响应方法
onconnect = function (event) {
    console.log('[' + Date() + '] ' + 'sharedworker connected successfully!');

    port = event.ports[0]
    port.onmessage = function (event) {
        if (WebSocket.OPEN != ws.readyState) {
            console.log('[' + Date() + '] ' + 'ws is not opened, current state is ' + strWsState(ws.readyState))
        }

        OnHandleWorkerMessage(event.data)
    }

    port.onclose = function () {
        console.log('[' + Date() + '] ' + 'shared worker closed!')
    }
}

onerror = function () {
    console.log('[' + Date() + '] ' + 'There is an error with shared worker!')
}

function OnHandleWorkerMessage(msg) {
    switch (parseInt(msg)) {
        case 1: //camera
            OnHandleWorkerGetCamera()
            break;
        case 2: //radar
            OnHandleWorkerGetRadar()
            break;
        default:
            break;
    }
}

function OnHandleWorkerGetCamera() {
    if ('undefined' == typeof (camera)) {
        ws.send(JSON.stringify({
            evt: 1 // camera
        }))

        port.postMessage({evt: 1, body: {type: "camera", error: "none"}})
        return
    }

    port.postMessage({ evt: 1, body: camera })
}

function OnHandleWorkerGetRadar() {
    if ("undefined" == typeof (radar)) {
        ws.send(JSON.stringify({
            evt: 2 // radar
        }))

        port.postMessage({evt: 1, body: {type: "radar", error: "none"}})
        return
    }

    port.postMessage({ evt: 2, body: radar })
}