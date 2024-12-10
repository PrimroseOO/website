
let slider_Order = [];

async function setup() {
    const patchExportURL = "export/patch.export.json";

    // Create AudioContext
    const WAContext = window.AudioContext || window.webkitAudioContext;
    const context = new WAContext();

    // Create gain node and connect it to audio output
    const outputNode = context.createGain();
    outputNode.connect(context.destination);
    
    // Fetch the exported patcher
    let response, patcher;
    try {
        response = await fetch(patchExportURL);
        patcher = await response.json();
    
        if (!window.RNBO) {
            // Load RNBO script dynamically
            // Note that you can skip this by knowing the RNBO version of your patch
            // beforehand and just include it using a <script> tag
            await loadRNBOScript(patcher.desc.meta.rnboversion);
        }

    } catch (err) {
        const errorContext = {
            error: err
        };
        if (response && (response.status >= 300 || response.status < 200)) {
            errorContext.header = `Couldn't load patcher export bundle`,
            errorContext.description = `Check app.js to see what file it's trying to load. Currently it's` +
            ` trying to load "${patchExportURL}". If that doesn't` + 
            ` match the name of the file you exported from RNBO, modify` + 
            ` patchExportURL in app.js.`;
        }
        if (typeof guardrails === "function") {
            guardrails(errorContext);
        } else {
            throw err;
        }
        return;
    }

    // Create the device
    let device;
    try {
        device = await RNBO.createDevice({ context, patcher });
    } catch (err) {
        if (typeof guardrails === "function") {
            guardrails({ error: err });
        } else {
            throw err;
        }
        return;
    }

    // Connect the device to the web audio graph
    device.node.connect(outputNode);


    // (Optional) Automatically create sliders for the device parameters
    makeSliders(device);

    //~~~~~~~~~~~~~~prim~~~~~~~~~~~~~~~
    //~~~~~~~~~~~~~start~~~~~~~~~~~~~~

    cc_UI(device);

    midi_Connect(device);

    //~~~~~~~~~~~~~end~~~~~~~~~~~~~~~
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    document.body.onclick = () => {
        context.resume();
    }

    // Skip if you're not using guardrails.js
    if (typeof guardrails === "function")
        guardrails();
}

function loadRNBOScript(version) {
    return new Promise((resolve, reject) => {
        if (/^\d+\.\d+\.\d+-dev$/.test(version)) {
            throw new Error("Patcher exported with a Debug Version!\nPlease specify the correct RNBO version to use in the code.");
        }
        const el = document.createElement("script");
        el.src = "https://c74-public.nyc3.digitaloceanspaces.com/rnbo/" + encodeURIComponent(version) + "/rnbo.min.js";
        el.onload = resolve;
        el.onerror = function(err) {
            console.log(err);
            reject(new Error("Failed to load rnbo.js v" + version));
        };
        document.body.append(el);
    });
    
}

function makeSliders(device) {
    let pdiv = document.getElementById("rnbo-parameter-sliders");
    let noParamLabel = document.getElementById("no-param-label");
    if (noParamLabel && device.numParameters > 0) pdiv.removeChild(noParamLabel);

    // This will allow us to ignore parameter update events while dragging the slider.
    let isDraggingSlider = false;
    let uiElements = {};

    device.parameters.forEach(param => {
        
    //~~~~~~~~~~~~~prim~~~~~~~~~~~~~~~
    //~~~~~~~~~~~~~start~~~~~~~~~~~~~~

        slider_Order.push(param.name);

    //~~~~~~~~~~~~~end~~~~~~~~~~~~~~~
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


        // Create a label, an input slider and a value display
        let label = document.createElement("label");
        let slider = document.createElement("input");
        let text = document.createElement("input");
        let sliderContainer = document.createElement("div");
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(text);

        // also added this -prim
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        sliderContainer.setAttribute("name", param.name);
        //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

        // Add a name for the label
        label.setAttribute("name", param.name);
        label.setAttribute("for", param.name);
        label.setAttribute("class", "param-label");
        label.textContent = `${param.name}: `;

        // Make each slider reflect its parameter
        slider.setAttribute("type", "range");
        slider.setAttribute("class", "param-slider");
        slider.setAttribute("id", param.id);
        slider.setAttribute("name", param.name);
        slider.setAttribute("min", param.min);
        slider.setAttribute("max", param.max);
        if (param.steps > 1) {
            slider.setAttribute("step", (param.max - param.min) / (param.steps - 1));
        } else {
            slider.setAttribute("step", (param.max - param.min) / 1000.0);
        }
        slider.setAttribute("value", param.value);

        // Make a settable text input display for the value
        text.setAttribute("value", param.value.toFixed(2));
        text.setAttribute("type", "text");

        // Make each slider control its parameter
        slider.addEventListener("pointerdown", () => {
            isDraggingSlider = true;
        });
        slider.addEventListener("pointerup", () => {
            isDraggingSlider = false;
            slider.value = param.value;
            text.value = param.value.toFixed(2);
        });
        slider.addEventListener("input", () => {
            let value = Number.parseFloat(slider.value);
            param.value = value;
        });

        // Make the text box input control the parameter value as well
        text.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") {
                let newValue = Number.parseFloat(text.value);
                if (isNaN(newValue)) {
                    text.value = param.value;
                } else {
                    newValue = Math.min(newValue, param.max);
                    newValue = Math.max(newValue, param.min);
                    text.value = newValue;
                    param.value = newValue;
                }
            }
        });

        // Store the slider and text by name so we can access them later
        uiElements[param.id] = { slider, text };

        // Add the slider element
        pdiv.appendChild(sliderContainer);
    });

    // Listen to parameter changes from the device
    device.parameterChangeEvent.subscribe(param => {
        if (!isDraggingSlider)
            uiElements[param.id].slider.value = param.value;
        uiElements[param.id].text.value = param.value.toFixed(2);
    });


}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// everything here on out I wrote
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

function midi_Connect(device) {

    //starts webmidi access
    navigator.requestMIDIAccess()
    .then(onMIDISuccess, onMIDIFailure);

    function onMIDIFailure() {
        console.log('Could not access your MIDI devices.');
    }

    function onMIDISuccess(midiAccess) {
        for (var input of midiAccess.inputs.values()) {
            input.onmidimessage = getMIDIMessage;
        }
    }

    //format of message from webmidi
    //    status data data
    //      cc   cc#  val
    //   [ 176 , 25,  3 ]



    function getMIDIMessage(midiMessage) {

        //grab only midi messages
        const values = midiMessage.data;

        //if theres a cc message
        if (values[0] == 176) {

            // grab needed elements which is sliders, param select element, and cc select element
            // checks every mapping each time a cc message is received
            // because new mapping might happen between messages
            // also because I wanted to delete a map easily
            let div = document.getElementById("rnbo-parameter-sliders")
            let ccC = document.getElementById("cc_Container");
            const pSel = ccC.querySelectorAll('.param');
            const ccSel = ccC.querySelectorAll('.cc');

            // for each group of pSel & ccSel pass in object and current index
            ccSel.forEach((select, index) => {

                //if mapped cc# == received cc#
                if (select.value == values[1]) {

                    // grab corresponding slider and text entry
                    // the index is important so we can get the name of the selected param with
                    // pSel[index].value which will equal "cutoff" or something similar
                    const slider = div.querySelector(`div[name="${pSel[index].value}"] > input[type="range"]`);
                    const text = div.querySelector(`div[name="${pSel[index].value}"] > input[type="text"]`);

                    // this scales the incoming cc value to the min and max of the slider
                    // equivalent of max [scale 0 127 0 22,000] 
                    // unfortunately cc is only 0 - 127 because MIDI so theres steps
                    let to = ((values[2] / 127) * (Math.abs(slider.min) + slider.max)) - slider.min;

                    // two decimal points
                    slider.value = to.toFixed(2);
                    text.value = to.toFixed(2);

                    // this is why I store the order of the sliders so I can 
                    // grab the index of the parameter thats being changed
                    // then use that to update the parameter in the rnbo device
                    // there is probably an easier way but the device parameters 
                    // aren't stored at an index not a key :-(
                    param_Index = slider_Order.indexOf(pSel[index].value)
                    device.parameters[param_Index].value = Number.parseFloat(to.toFixed(2))

                }

            });

        }

        // sends all midi events into rnbo [midiin] objects
        let data_to_RNBO = new RNBO.MIDIEvent(RNBO.TimeNow, 0, values);
        device.scheduleEvent(data_to_RNBO);

    }
        
}

function cc_UI (device) {

    // grabs container for cc mapping and add button
    let cc_Div = document.getElementById("cc_Container");
    let add_Button = document.getElementById("add");
    
    // when add button is clicked
    add_Button.addEventListener("click", () => { 

        // creates a container div
        let div = document.createElement("div");
        div.setAttribute("id", "cc_Map")

        // creates a select object and adds class param I don't think I used that
        // then for each parameter we add it as an option
        let param_Sel = document.createElement("select")
        param_Sel.classList.add("param");
        device.parameters.forEach(param => {
            const option = document.createElement("option");
            option.innerText = param.name;
            param_Sel.appendChild(option);
        });

        // similar for cc except its numbers 0-127 for the cc numbers
        let cc_Sel = document.createElement("select")
        cc_Sel.classList.add("cc");
        for (let i = 0; i < 128; i++) {
            const option = document.createElement("option");
            option.innerText = i;
            cc_Sel.appendChild(option);
        }

        // creates a delete button
        let t_Div = document.createElement("div");
        t_Div.innerText = "X";
        t_Div.addEventListener("click", () => {
            div.remove()
        });

        // selects and delete button into container 
        // and container put into the everything cc container
        div.appendChild(param_Sel);
        div.appendChild(cc_Sel);
        div.appendChild(t_Div);
        cc_Div.appendChild(div);

    });
 
}

// except this I didn't write this line
setup();
// could definetely be cleaned up but 
// hey it works 