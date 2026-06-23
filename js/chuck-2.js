const chuckCode = `

// DOH!!!

// the patch 
SndBuf buf => dac;
// load the file ("special:" files are built into chuck)
"special:dope" => buf.read;

// set playback position to beginning
0 => buf.pos;
// randomize playback rate
Math.random2f(.5,1.5) => buf.rate;
// randomize time
600::ms => now;
me.exit();


`;

import { Chuck } from 'https://cdn.jsdelivr.net/npm/webchuck/+esm';

const editor = newChuckEditor(document.getElementById("editor"), chuckCode);

const states = Object.freeze({
    playing: 0,
    stopped: 1
});
let status = states.stopped;

const action = document.querySelector('#action2');
const action3 = document.querySelector('#action3');

let theChuck; // global variable

// Play button
action.addEventListener('click', async () => {

// Initial load
if (theChuck === undefined) {
    action.disabled = true;
    // action.innerHTML = "Loading...";
    theChuck = await Chuck.init([]);
    action.disabled = false;
}

switch (status) {
    case states.playing:
    status = states.stopped;
    theChuck.runCode(editor.getValue());
    // Stop button
    // action.innerHTML = `
    //     Play

    // `;
    break;
    case states.stopped:
    status = states.playing;
    theChuck.runCode(editor.getValue());
    // Play button
    // action.innerHTML = `
    //     Stop

    // `;
    break;
}
});
action3.addEventListener('click', async () => {

// Initial load
if (theChuck === undefined) {
    action3.disabled = true;
    // action.innerHTML = "Loading...";
    theChuck = await Chuck.init([]);
    action.disabled = false;
}

switch (status) {
    case states.playing:
    status = states.stopped;
    theChuck.runCode(editor.getValue());
    // Stop button
    // action.innerHTML = `
    //     Play

    // `;
    break;
    case states.stopped:
    status = states.playing;
    theChuck.runCode(editor.getValue());
    // Play button
    // action.innerHTML = `
    //     Stop

    // `;
    break;
}
});