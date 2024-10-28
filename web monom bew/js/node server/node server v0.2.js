const WebSocket = require("ws");
const websocket_Server = new WebSocket.Server({ port: 8080 });

let websocket_Connection;

const osc = require("osc");

let localhost_Connection;
let sys_localhost_Connection;

const sys_Info = {
    
    local_Port: 57121,
    remote_Address: "127.0.0.1",
    grid_XY: [],
    rotation: 0,
    prefix: "/monome",
    ID: "w0000001",
    remote_Port: 57120,
    address: [
        "/sys/port",
        "/sys/host",
        "/sys/size",
        "/sys/rotation",
        "/sys/prefix",
        "/sys/id",
        "/sys/port/remote"
    ]
}
const keys = Object.keys(sys_Info); 
// /sys/port send local port


// Open WebSocket stream on connection and start localhost_connection_INIT
websocket_Server.on("connection", (ws) => {
    console.log("Client connected");
    websocket_Connection = ws;
    websocket_Connection.once("message", (m) => handshake(m));

    // Set up WebSocket message listener if not already done

    localhost_connection_INIT(
        sys_Info.remote_Port,
        sys_Info.local_Port,
        sys_Info.remote_Address
    );
    localhost_Connection.on("message", (m) => sort_localhost_Messages(m));
});








function localhost_connection_INIT(sPort, rPort, host) {
    console.log("inside localhost connection init")
    //if (sPort == rPort) throw new Error("Send and receive ports are the same; message ignored");
    if (localhost_Connection) {
        localhost_Connection.close();
        localhost_Connection.on("close", () => console.log("closing node server connection, reopening..."));
    }
    localhost_Connection = new osc.UDPPort({
        localAddress: host, //localhost
        localPort: rPort,   //port to listen to
        remoteAddress: host, //localhost
        remotePort: sPort   //port to send to
    });
    localhost_Connection.open();
    localhost_Connection.on("ready", () => {
        console.log(`connected to local ${host}:${rPort}, remote ${host}:${sPort}`);
    });
}



function sys_localhost_connection_INIT(sPort, host = sys_Info.remote_Address) {
    if (sys_localhost_Connection) {
        sys_localhost_Connection.close();
        sys_localhost_Connection.on("close", () => console.log("sys_localhost_Connection closed, restarting..."));
    }
    sys_localhost_Connection = new osc.UDPPort({
        localAddress: host,
        localPort: 0,
        remoteAddress: host,
        remotePort: sPort
    });
    sys_localhost_Connection.open();
    console.log("sys_localhost_Connection opened")
}







function sort_localhost_Messages(m) {

    
    switch (m.address) {
        case "/sys/port":
            localhost_connection_INIT(
                m.args[1],
                sys_Info.local_Port,
                sys_Info.remote_Address
            );
            break;
        case "/sys/host":
            localhost_connection_INIT(
                sys_Info.remote_Port,
                sys_Info.local_Port,
                m.args[1]
            );
            break;
        case "/sys/prefix":
        //    websocket_Connection.send(JSON.stringify(m));
            break;
        case "/sys/rotation":
            console.log("Rotation message received and ignored");
            break;
        case "/sys/info":
            osc_Info(m);
            break;
        default:
            websocket_Connection.send(JSON.stringify(m));
            break;
    }
}



function handle_websocket_Message(m) {

    console.log("message received from websocket client")
    m = JSON.parse(m);

    /*
    if (m.address == "/sys/info") {

        if (m.args[0][1][0] != sys_Info.remote_Address || m.args[0][1][1] != sys_Info.remote_Port) {

            sys_localhost_connection_INIT(m.args[0][1][1], m.args[0][1][0]);
            to_sys_Localhost(m)
            console.log("relayed to sys_localhost_Connection");

        } else {
            sys_to_Localhost(m);
            console.log("relayed to localhost_Connection");
        }
    } else {
    */
        m.address = sys_Info.prefix + m.address;
        
        localhost_Connection.send(m);
        console.log("relayed to localhost_Connection");


    
    
}











function osc_Info(m) {

    if (m.args.length == 0) {
        sys_to_Localhost();
        console.log("relayed to localhost_Connection");

    } else {
        if (m.args.length == 1) m.args.unshift(sys_Info.remote_Address)
        sys_localhost_connection_INIT(m.args[1], m.args[0]);
        to_sys_Localhost(m)
        console.log("relayed to sys_localhost_Connection");
        
    } 




    
    

}


function to_sys_Localhost(m) {
    sys_localhost_Connection.on("ready", () => {
        for (let i = 0; i < 6; i++) {
            sys_localhost_Connection.send({
                address: sys_Info.address[i],
                args: sys_Info[keys[i]]
            });
        } 
    });
}

function sys_to_Localhost(m) {
    for (let i = 0; i < 6; i++) {
        localhost_Connection.send({
            address: sys_Info.address[i],
            args: sys_Info[keys[i]]
        });
    }
}



function handshake(m) {
    m = JSON.parse(m);
    sys_Info.grid_XY = [m.x, m.y];

    //this should be moved somewhere else not part of handshake
    websocket_Connection.on("message", (m) => handle_websocket_Message(m));
}
