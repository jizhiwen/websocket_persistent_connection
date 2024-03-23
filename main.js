var Observer = []
var myWorker = new window.SharedWorker("worker.js")

function Request(evt) {
    myWorker.port.postMessage(evt)
}

myWorker.port.onmessage = function (e) {
    var evt = parseInt(e.data.evt)
    if ('undefined' == typeof(Observer[evt])) {
        return
    }

    Observer[evt](e.data.body)
}

window.onclose = function () {
    myWorker.port.close()
}