async function setup() {
    const patchExportURL = "/rnbo export/patch.export.json";

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
    
    // (Optional) Fetch the dependencies
    let dependencies = [];
    try {
        const dependenciesResponse = await fetch("/rnbo export/dependencies.json");
        dependencies = await dependenciesResponse.json();

        // Prepend "export" to any file dependenciies
        dependencies = dependencies.map(d => d.file ? Object.assign({}, d, { file: "/rnbo export/" + d.file }) : d);
    } catch (e) {}

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

    // (Optional) Load the samples
    if (dependencies.length)
        await device.loadDataBufferDependencies(dependencies);

    // Connect the device to the web audio graph
    device.node.connect(outputNode);


    // (Optional) Automatically create sliders for the device parameters
    makeSliders(device);

    // (Optional) Create a form to send messages to RNBO inputs
    makeInportForm(device);


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
        // Subpatchers also have params. If we want to expose top-level
        // params only, the best way to determine if a parameter is top level
        // or not is to exclude parameters with a '/' in them.
        // You can uncomment the following line if you don't want to include subpatcher params
        
        //if (param.id.includes("/")) return;

        // Create a label, an input slider and a value display
        let label = document.createElement("label");
        let slider = document.createElement("input");
        let text = document.createElement("input");
        let sliderContainer = document.createElement("div");
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(text);

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
        text.id = "text_box_" + param.id;

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

function makeInportForm(device) {


    const inportTransport = document.getElementById("transport");
    const sequencer = document.getElementById("sequencer");
    
    // Device messages correspond to inlets/outlets or inports/outports
    // You can filter for one or the other using the "type" of the message
    const messages = device.messages;
    const inports = messages.filter(message => message.type === RNBO.MessagePortType.Inport);


        inports.forEach(inport => {

            if (inport.tag == "in3") {

                const box = document.createElement("button");
                box.id = "transport_0/1";
                inportTransport.appendChild(box);
                box.innerText = "start";
                

                box.onclick = function() {

                    if (box.innerText == "start") {
                        box.innerText = "stop";
                        
                        const transportOn = 1;
                        
                        let transportMessage = new RNBO.MessageEvent(RNBO.TimeNow, inport.tag, transportOn);
                        device.scheduleEvent(transportMessage);

                        const tempo = document.getElementById("tempo").value;
                        const ms = 60000/tempo;
                        box.style.animation = "none";
                        void box.offsetWidth;
                        box.style.animation = "transport_Blink " + ms + "ms steps(1) infinite";

                    } else if (box.innerText == "stop") {
                        box.innerText = "start";

                        const transportOff = 0;
                        let transportMessage = new RNBO.MessageEvent(RNBO.TimeNow, inport.tag, transportOff);
                        device.scheduleEvent(transportMessage);

                        box.style.animation = "none";
                        

                    }

                    

                }

            }


            if (inport.tag == "in2") {

                
                
                for (let i = 0; i < 6; i++) {

                    const instrument = document.createElement("div");
                    sequencer.appendChild(instrument);
                    instrument.classList.add("instrument")
                    instrument.style.backgroundColor = "#aaaaaa";

                    if (i == 5) {
                        instrument.innerText = "kick";
                    } else if (i == 4) {
                        instrument.innerText = "snare";
                    } else if (i == 3) {
                        instrument.innerText = "clap";
                    } else if (i == 2) {
                        instrument.innerText = "HH";
                    } else if (i == 1) {
                        instrument.innerText = "OH";
                    } else if (i == 0) {
                        instrument.innerText = "ride";
                    }
                    
                    

                    for (let j = 0; j < 16; j++) {

                    
                        const stepSequencer = document.createElement("div");
                        sequencer.appendChild(stepSequencer);

                        if (j % 4 == 0) {
                            stepSequencer.style.backgroundColor = "#AAAAAA";
                        } else if (j % 4 != 0) {
                            stepSequencer.style.backgroundColor = "#CCCCCC"; 
                        }
                    
                        stepSequencer.id = "step" + j;
                        stepSequencer.classList.add("sequencerRow0");
                        stepSequencer.classList.add("0")
                        //console.log(stepSequencer.id);
                        //console.log(stepSequencer.style.backgroundColor);

                        stepSequencer.onclick = function() {

                        

                            if (stepSequencer.classList.contains("0")) {

                                if (j % 4 == 0) {
                                    stepSequencer.style.backgroundColor = "#ABBFFF";
                                } else if (j % 4 != 0) {
                                    stepSequencer.style.backgroundColor = "#E6F0FF"; 
                                }
                                stepSequencer.classList.replace("0", "1");

                                const sequence = [Math.abs(i - 5), j, 1];
                                console.log(sequence);
                                let sequenceMessage = new RNBO.MessageEvent(RNBO.TimeNow, inport.tag, sequence);
                                device.scheduleEvent(sequenceMessage);
                            

                            } else if (stepSequencer.classList.contains("1")) {

                                if (j % 4 == 0) {
                                    stepSequencer.style.backgroundColor = "#AAAAAA";
                                } else if (j % 4 != 0) {
                                    stepSequencer.style.backgroundColor = "#CCCCCC"; 
                                }
                                stepSequencer.classList.replace("1", "0");

                                const sequence = [Math.abs(i - 5), j, 0];
                                let sequenceMessage = new RNBO.MessageEvent(RNBO.TimeNow, inport.tag, sequence);
                                device.scheduleEvent(sequenceMessage);


                            }

                        }

                    }

                }

            }

        });
        
        
        const tempo = document.getElementById("tempo");
        const tempo1 = document.getElementById("text_box_tempo");
        
        tempo.addEventListener('change', function() {  
            const box = document.getElementById("transport_0/1");
            const ms = 60000/tempo.value;
            console.log(ms);
            box.style.animation = "none";
            void box.offsetWidth;
            box.style.animation = "blink " + ms + "ms steps(1) infinite";
        });
        
        tempo1.addEventListener('change', function() {  
            const box = document.getElementById("transport_0/1");
            const ms = 60000/tempo.value;
            console.log(ms);
            box.style.animation = "none";
            void box.offsetWidth;
            box.style.animation = "blink " + ms + "ms steps(1) infinite";
        });
        
    
}

setup();
