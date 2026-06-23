const chuckCode = `// chuck '(Auto) Manufacturing Co.ck' -o:8
1 => int playing;

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
LiSa lisa( me.dir() + "rich.wav" )[4] => Envelope envelopeLisa[4] => Pan2 pan => dac;

for (auto l : lisa) {
    1.0 => l.rate; // rate!
    1 => l.loop;
    l.duration() * 0.88 => l.loopEnd;
    1 => l.bi;
}

fun void lisaPlay(LiSa elise[], int p) {
    for (auto l : elise) {
        p => l.play;
    }
}
fun void lisaRate(LiSa elise[], float rate) {
    for (auto l : elise) {
        rate => l.rate;
    }
}
fun dur envRamp(Envelope env[], dur samples, float destination) {
    for (0 => int i; i < envelopeLisa.size(); i++) {
        env[i].ramp(samples, destination);
    }
    return samples;
}
envRamp(envelopeLisa, 1::samp, 1);
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
SndBuf buf => Gain g => DelayA delay[Math.random2(250,500)] => blackhole;
buf.read(me.dir() + "fuzz.wav");
buf.loop(1);
buf.play(0.9);
g.gain(0.01);
Gain g1;
HPF dcblock;
5 => dcblock.freq;
g1.gain(40);

0.01 => float bufModulateTimeScale;

for (0 => int i; i < delay.size(); i++) {
    (1::samp) => delay[i].delay;
    delay[i].max(15000::samp);
    if (i < delay.size() - 1) {
        delay[i] => delay[i + 1];
        // <<<i, "chucked to:", i+1>>>;
    } else {
        delay[i] => g1 => dcblock => dac;
        // <<<i, "chucked to: dac">>>;
    }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
SndBuf water => Envelope waterEnvelope => Gain gainWater => Delay delayWater => dac;
waterEnvelope.ramp(1::ms, 0);
gainWater.gain(5);
water.read(me.dir() + "water.wav");
water.loop(1);
water.play(0);
delayWater.max(1000::ms);
delayWater.delay(200::ms);
Gain feedback => delayWater => feedback;
feedback.gain(0.6);
1 => float grainScale;

fun void waterPosition() {
    while (true) {
        (Math.random2f(0, 1) * water.samples()) $ int => water.pos;
        grainScale * 1::samp => now;
    }
} spork ~ waterPosition();
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
SndBuf2 rich0 => Envelope env => dac;
LiSa rich1;
rich1.read( me.dir() + "rich.wav" );
rich1 => Envelope env_Lisa => dac;
1.0 => rich1.rate; // rate!
1 => rich1.loop; 
1 => rich1.bi;

me.dir() + "rich.wav" => rich0.read;
rich0.gain(1.5); 

env_Lisa.ramp(1::samp, 1);

fun void play_Buf(SndBuf2 b, Envelope e, int j) {
    rich0.pos(800);
    if (j < 3) {
        rich0.play(0.78);
    } else {
        rich0.play(0.84);
    }
    env.ramp(1::samp, 1.5) => now;
    env.ramp(400::ms, 0.5) => now;
    env.ramp(1300::ms, 1) => now;
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

fun void doAudio() {
    15::second => now;
    buf.play(0);
    g1.gain(30);

    for (0 => int j; j < 3; j++) {
        if (j == 1) {
            g1.gain(15);
            water.play(1);
            waterEnvelope.ramp(20::second, 1);
        } else if (j == 2) {
            0.001 => bufModulateTimeScale;
        }
        envRamp(envelopeLisa, 2300::ms, 1);
        lisaPlay(lisa, 1);
        2300::ms => now;
        envRamp(envelopeLisa, 2300::ms, 0.2);
        1000::ms => now;
        // lisaRate(lisa, 0);

        for (0 => int i; i < 4; i++) {
            dur temp;
            if (j == 0) {
                if (i == 0) {
                    124009.2 / 44100 * 1000::ms => temp;
                } else if (i == 1) {
                    86039.1 / 44100 * 1000::ms => temp;
                } else if (i == 2) {
                    96490.8 / 44100 * 1000::ms => temp;
                } else {
                    68443.2 / 44100 * 1000::ms => temp;
                }
            } else if (j == 1) {
                if (i == 0) {
                    81452.7 / 44100 * 1000::ms => temp;
                } else if (i == 1) {
                    94991.4 / 44100 * 1000::ms => temp;
                } else if (i == 2) {
                    98651.7 / 44100 * 1000::ms => temp;
                } else {
                    111793.5 / 44100 * 1000::ms => temp;
                }
            } else if (j == 2) {
                if (i == 0) {
                    108838.8 / 44100 * 1000::ms => temp;
                } else if (i == 1) {
                    75543.3 / 44100 * 1000::ms => temp;
                } else if (i == 2) {
                    77219.1 / 44100 * 1000::ms => temp;
                } else {
                    103590.9 / 44100 * 1000::ms => temp;
                }
            }
            
            // Math.random2 > dur temp;
            // <<<temp>>>;
            temp => now;
        }        
    }
    buf =< g;
    // delay[delay.size() - 1] =< g1;
    // g1.gain(0);
    lisa[0] => g;
    g1.gain(3);
    lisaRate(lisa, 0.78);
    envRamp(envelopeLisa, 2300::ms, 1.8) => now;

    for (0 => int j; j < 3; j++) {
        lisaPlay(lisa, 1);
        2300::ms => now;
        envRamp(envelopeLisa, 2300::ms, 1.5) => now;

        for (0 => int i; i < 4; i++) {
            envRamp(envelopeLisa, 2300::ms, 0.4) => now;
            // Math.random2(1500, 3000)::ms => now;
        }


        if (j == 2) {
            envRamp(envelopeLisa, 2300::ms, 0.4);
            waterEnvelope.ramp(2.4::second, 0.3);
            for (0 => int k; k < 3; k++) {
                env_Lisa.ramp(2300::ms, 1);
                1 => rich1.play; // play!
                2300::ms => now;
                envRamp(envelopeLisa, 2300::ms, 0.1);
                waterEnvelope.ramp(2.4::second, 0.2);                
                env_Lisa.ramp(2300::ms, 0.2);
                1000::ms => now;
                0 => rich1.rate;

                for (0 => int l; l < 2; l++) {
                    dur temp;
                    if (k == 0) {
                        if (l == 0) {
                            71133.3 / 44100 * 1000::ms => temp; 
                        } else if (l == 1) {
                            115145.1 / 44100 * 1000::ms => temp; 
                        } 
                    } else if (k == 1) {
                        if (l == 0) {
                            125640.9 / 44100 * 1000::ms => temp; 
                        } else if (l == 1) {
                            126390.6 / 44100 * 1000::ms => temp; 
                        } 
                    } else if (k == 2) {
                        if (l == 0) {
                            112058.1 / 44100 * 1000::ms => temp; 
                        } else if (l == 1) {
                            77924.7 / 44100 * 1000::ms => temp; 
                        } 
                    }
                    g1.gain(0.6);
                    play_Buf(rich0, env, l);
                    // Math.random2(1500, 3000)::ms => dur temp;
                    // <<<temp>>>;
                    temp => now;
                }
            }

            0.78 => rich1.rate; // play!
            env_Lisa.ramp(2300::ms, 1) => now;

            for (0 => int k; k < 3; k++) {
                1 => rich1.play; // play!
                2300::ms => now;
                env_Lisa.ramp(2300::ms, 0.7) => now;

                for (0 => int l; l < 2; l++) {
                    env_Lisa.ramp(2300::ms, 0);
                    env.ramp(2300::ms, 0);
                    rich0.gain(0.8);
                    play_Buf(rich0, env, l);
                    dur temp;
                    if (k == 0) {
                        if (l == 0) {
                            83304.9 / 44100 * 1000::ms => temp; 
                        } else if (l == 1) {
                            76116.6 / 44100 * 1000::ms => temp; 
                        } 
                    } else if (k == 1) {
                        if (l == 0) {
                            112763.7 / 44100 * 1000::ms => temp; 
                        } else if (l == 1) {
                            73514.7 / 44100 * 1000::ms => temp; 
                        } 
                    } else if (k == 2) {
                        if (l == 0) {
                            106766.1 / 44100 * 1000::ms => temp; 
                        } else if (l == 1) {
                            117085.5 / 44100 * 1000::ms => temp; 
                        } 
                    }
                    // Math.random2(1500, 3000)::ms => dur temp;
                    // <<<temp>>>;
                    temp => now;
                }
            }

            env.ramp(3::second, 0.05) => now;
            200::ms => now;
            env.ramp(2::second, 3) => now;
            0 => playing;
            me.exit();
        }
    }
} spork ~ doAudio();

0 => int timer;
while (playing) {
    for (0 => int i; i < delay.size(); i++) {
        ((Math.sin(timer * bufModulateTimeScale) + 2 ) * 1 * ( i + 1 )) * 1::samp => delay[i].delay;
    }

    //                                3.9 for 8 channels
    (Math.sin(timer * 0.001) + 1.1) * 0.9 => pan.pan;

    (timer + 1) * 0.0007 => grainScale;

    timer++;
    1::ms => now;
}`;

import { Chuck } from 'https://cdn.jsdelivr.net/npm/webchuck/+esm';


const editor = newChuckEditor(document.getElementById("editor"), chuckCode);

const states = Object.freeze({
playing: 0,
stopped: 1
});
let status = states.stopped;

const action = document.querySelector('#action');

let theChuck; // global variable

// Play button
action.addEventListener('click', async () => {
// Initial load
if (theChuck === undefined) {
    action.disabled = true;
    action.innerHTML = "Loading...";
    theChuck = await Chuck.init( [{"serverFilename":"./fuzz.wav","virtualFilename":"fuzz.wav"},{"serverFilename":"./rich.wav","virtualFilename":"rich.wav"},{"serverFilename":"./water.wav","virtualFilename":"water.wav"}] );
    action.disabled = false;
}

switch (status) {
    case states.playing:
    status = states.stopped;
    theChuck.removeLastCode();
    // Stop button
    action.innerHTML = `
        Play

    `;
    break;
    case states.stopped:
    status = states.playing;
    theChuck.runCode(editor.getValue());
    // Play button
    action.innerHTML = `
        Stop

    `;
    break;
}
});