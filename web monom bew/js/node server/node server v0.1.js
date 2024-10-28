const WebSocket = require('ws');
const osc = require('osc');
const ws_Server = new WebSocket.Server({ port: 8080 });
let osc_Port;
let sys_osc_Port;
let ws_Stream;
let send_Port = 57120;
let receive_Port = 57121;
let dest_Host = '127.0.0.1';
const sys_ID = "w0000001";

// Open WebSocket stream on connection and start osc_Handle
ws_Server.on('connection', (ws) => {
    ws_Stream = ws;
    console.log("Client connected");

    if (osc_Port) osc_Port.close();

    osc_Handle(send_Port, receive_Port, dest_Host);

    // Set up WebSocket message listener if not already done
    ws_Stream.on('message', (message) => handleWebSocketMessage(message));
});

function osc_Handle(sPort, rPort, host) {

    if (osc_Port) {
        osc_Port.close();
        osc_Port.on("close", () => {
            console.log("OSC port closed, reopening...");
            initializeOscPort(sPort, rPort, host);
        });
    } else {
        initializeOscPort(sPort, rPort, host);
    }
}

function initializeOscPort(sPort, rPort, host) {
    osc_Port = new osc.UDPPort({
        localAddress: host,
        localPort: rPort,
        remoteAddress: host,
        remotePort: sPort
    });

    osc_Port.open();

    osc_Port.on('ready', () => {
        console.log(`OSC port opened \nhost: ${host} \nsend: ${sPort} receive: ${rPort}\n`);
    });

    // Relay OSC messages to the WebSocket client
    osc_Port.on('message', (osc_Message) => {
        switch (osc_Message.address) {
            case '/sys/port':
                if (receive_Port == osc_Message.args[1]) {
                    console.log("Send and receive ports are the same; message ignored");
                    break;
                }
                send_Port = osc_Message.args[1];
                osc_Port.close();
                osc_Handle(send_Port, receive_Port, dest_Host);
                break;
            case '/sys/host':
                dest_Host = osc_Message.args[1];
                osc_Port.close();
                osc_Handle(send_Port, receive_Port, dest_Host);
                break;
            case '/sys/rotation':
                console.log('Rotation message value:', osc_Message.args[1]);
                break;
            case '/sys/info':
                osc_Info(osc_Message);
                break;
            default:
                ws_Stream.send(JSON.stringify(osc_Message));
                break;
        }
    });
}

function handleWebSocketMessage(message) {
    const osc_Message = JSON.parse(message);

    if (osc_Message.address == "/sys/info") {
        // Open a temporary OSC port for sending specific info, then close it
        if (osc_Message.args[0][1].length == 1) {
            sys_osc_port_INIT(osc_Message.args[0][1][0], 0, dest_Host, osc_Message);
        } else if (osc_Message.args[0][1].length == 2) {
            sys_osc_port_INIT(osc_Message.args[0][1][1], 0, osc_Message.args[0][1][0], osc_Message);
        } else {
            for (let i = 1; i < 7; i++) {
                osc_Port.send({
                    address: osc_Message.args[i][0],
                    args: osc_Message.args[i][1]
                });
            }
        }
    } else {
        osc_Port.send({
            address: osc_Message.address,
            args: osc_Message.args
        });
    }
}

function osc_Info(oscMessage) {
    // Attach additional properties to OSC message and send to WebSocket
    oscMessage.port = send_Port;
    oscMessage.host = dest_Host;
    oscMessage.id = sys_ID;
    oscMessage.rotation = 0;
    ws_Stream.send(JSON.stringify(oscMessage));
}

function sys_osc_port_INIT(sPort, rPort, host, osc_Message) {

    //if (sys_osc_Port) sys_osc_Port.close();

    sys_osc_Port = new osc.UDPPort({
        localAddress: host,
        localPort: rPort,
        remoteAddress: host,
        remotePort: sPort
    });

    sys_osc_Port.open();

    sys_osc_Port.on("ready", () => {
        for (let i = 1; i < 7; i++) {
            sys_osc_Port.send({
                address: osc_Message.args[i][0],
                args: osc_Message.args[i][1]
            });
        }
        
        // Allow time to send data before closing
        setTimeout(() => sys_osc_Port.close(), 100);
    });

    sys_osc_Port.on("close", () => {
        console.log("Temporary sys_osc_Port closed");
    });
}
