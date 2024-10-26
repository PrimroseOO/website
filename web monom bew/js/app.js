const ws = new WebSocket('ws://localhost:8080');
let device_Prefix = '/monome';
const grid_Container = document.getElementById("grid-container");
const grid_X = 16;
const grid_Y = 8;

function setup() {

    //setup is called clear console and print

    console.log("setup called")

    //creates all div in grid-container
    console.log('creating grid_Divs...')
    for (let i = 0; i < grid_X * grid_Y; i++) {

        //only allows x 0-15 and 0-15       
        const x = i % 16;
        const y = Math.floor(i / 16);

        //create grid Divs append to grid Div add off class and give x and y coords
        const grid_Div = document.createElement("div");
        grid_Container.appendChild(grid_Div);
        grid_Div.classList.add("off");
        grid_Div.x = x;
        grid_Div.y = y;

        //attach listener for click on div then sends osc message /grid/led/key [x, y, 0 or 1]
        grid_Div.addEventListener("click", function() {
            if (grid_Div.classList.contains("off")) {
                grid_On(grid_Div);
                send_OSC(device_Prefix + "/grid/led/key", [grid_Div.x, grid_Div.y, 1]);
            } else if (grid_Div.classList.contains("on")) {
                grid_Off(grid_Div);
                send_OSC(device_Prefix + "/grid/led/key", [grid_Div.x, grid_Div.y, 0]);
            }
        });
    }

    //grid is completed
    console.log('grid created')

    //when you receive message from node.js check address and call appropriate function
    ws.onmessage = (event) => {
        const osc_Message = JSON.parse(event.data);
        console.log(`OSC RECEIVED\naddress: ${osc_Message.address} values: [${osc_Message.args}]`);
        switch (osc_Message.address) {
            case "/sys/prefix":
                //sets device prefix
                device_Prefix = osc_Message.args[0];
                console.log("device prefix changed to: " + device_Prefix);
                break;
            case "/sys/info":
                send_Info(osc_Message);
                break;
            case "/monome/grid/led/set": 
                osc_led_Set(osc_Message);
                break;
            case "/monome/grid/led/all":
                osc_led_All(osc_Message);
                break;
            case "/monome/grid/led/row":
                osc_RC(osc_Message, "row");
                break;
            case "/monome/grid/led/col":
                osc_RC(osc_Message, "col");
                break;
            case "/monome/grid/led/map":
                osc_Map(osc_Message);
                break;
        }
    };
}

//calls setup to run
setup();



//start osc funcions

//handles /sys/info
function send_Info(oscMessage) {

    //ws.send(JSON.stringify(oscMessage));
    //console.log(`OSC SENT\naddress: ${oscMessage.address} values: ${oscMessage.args}`);

    if (oscMessage.args.length >= 0) {
        const sysInfo = {
            
            address: "/sys/info",
            
            args: [
                ["/sys/info", oscMessage.args],
                ["/sys/port", oscMessage.port],
                ["/sys/host", oscMessage.host],
                ["/sys/id", oscMessage.id],
                ["/sys/prefix", device_Prefix],
                ["/sys/rotation", oscMessage.rotation],
                ["/sys/size", [grid_Y, grid_X]]
            ]
        };

        console.log(sysInfo);


        ws.send(JSON.stringify(sysInfo));
          
    }
}

//sends osc messages to node.js
function send_OSC(address, args) {

    const osc_Message = {
        address: address,
        args: args
    };
    ws.send(JSON.stringify(osc_Message));
    console.log(`OSC SENT\naddress: ${osc_Message.address} values: ${osc_Message.args}`);
}

//turns a cell on
function grid_On (gridDiv) {

    gridDiv.style.backgroundColor = "#eeeeee";
    gridDiv.classList.remove("off");
    gridDiv.classList.add("on");
}

//turns a cell off
function grid_Off (gridDiv) {

    gridDiv.style.backgroundColor = "#555555";
    gridDiv.classList.remove("on");
    gridDiv.classList.add("off");
}

//handles map message using osc_RC in "row"
function osc_Map(oscMessage) {

    if (oscMessage.args.length < 10) {
        console.log("not enough arguments, message ignored")
        return;
    }
    
    if (oscMessage.args[1] > grid_Y - 8) {
        oscMessage.args[1] = grid_Y - 8;
    } else if (oscMessage.args[1] < 0) {
        oscMessage.args[1] = 0;
    }

    for (let i = 0; i < grid_Y; i++) {

        oscMessage.args[2] = oscMessage.args[i + 2];
        osc_RC(oscMessage, "row");
        oscMessage.args[1]++;
    }
}

//handles /monome/grid/led/row & /monome/grid/led/col messages
function osc_RC (oscMessage, rc) {

    //stores offsets
    let offsetX = oscMessage.args[0];
    let offsetY = oscMessage.args[1];

    //constrains x from 0-7 if in rows or from 0-15 if in cols
    if (offsetX < 0) {
        offsetX = 0;
    } else if (rc == "row" && offsetX > grid_Y) {
        offsetX = grid_Y;
    } else if (rc == "col" && offsetX > grid_X - 1) {
        offsetX = grid_X - 1;
    }

    //constrains y from 0-7 if in rows or to 0 if in cols
    if (offsetY < 0) {
        offsetY = 0;
    } else if (rc == "row" && offsetY > grid_Y - 1) {
        offsetY = grid_Y - 1;
    } else if (rc == "col" && offsetY > 0) {
        offsetY = 0;
    }

    // if there are more than 2 args execute
    if (oscMessage.args.length > 2) {
        //converts int 0 - 255 into binary LSb first
        let bitMask = oscMessage.args[2].toString(2).padStart(8, '0');
        bitMask = bitMask.split('').reverse().join('');
        //console.log(`bitmask: ${bitMask} offset: ${offsetX} ${offsetY}`);

        //gets all grid Divs in grid Container
        const gridDivs = grid_Container.querySelectorAll("div");
        let selectedDivs;

        // stores all grid boxes within coords ((0-8, 0-7) if in rows) into selectedDivs
        // stores all grid boxes within coords ((0-15, 0) if in cols) into selectedDivs
        if (rc == "row") {
            selectedDivs = Array.from(gridDivs).filter(box => box.x >= 0 + offsetX && box.x < grid_Y + offsetX && box.y === offsetY);
        } else if (rc == "col") {
            selectedDivs = Array.from(gridDivs).filter(box => box.x === offsetX && box.y >= 0 + offsetY && box.y < grid_X + offsetY);
        }
        

        //turns on or off keys in selectedDivs based on bitMask
        for (let i = 0; i < 8; i++) {
            if (selectedDivs[i].classList.contains("off") && bitMask[i] == 1) {
                grid_On(selectedDivs[i])
            } else if (selectedDivs[i].classList.contains("on") && bitMask[i] == 0) {
                grid_Off(selectedDivs[i])
            }
        }
    }
}

//handles /monome/grid/led/set messages
function osc_led_Set(oscMessage) {

    const gridDivs = grid_Container.querySelectorAll("div");
    const selectedDiv = Array.from(gridDivs).filter(box => box.x === oscMessage.args[0] && box.y === oscMessage.args[1]);
    if (oscMessage.args[2] === 0) {
        grid_Off(selectedDiv[0]);
    } else if (oscMessage.args[2] === 1) {
        grid_On(selectedDiv[0]);  
    }
}

//handles /monome/grid/led/all messages
function osc_led_All(oscMessage) {

    if (oscMessage.args[0] === 0) {
        const boxes = grid_Container.querySelectorAll(".on");
        boxes.forEach(box => {
            grid_Off(box);
        }); 
    } else if (oscMessage.args[0] === 1) {
        const boxes = grid_Container.querySelectorAll(".off");
        boxes.forEach(box => {
            grid_On(box);
        }); 
    }
}