// VaporPlay by Kieran Walsh
/*
    Referenced the following when writing this code:
    Pitch shifting: https://zpl.fi/pitch-shifting-in-web-audio-api/
    Play local audio file: https://stackoverflow.com/questions/14074833/using-local-file-for-web-audio-api-in-javascript        
*/

// Variable assignments
// ********************

const AudioContext = window.AudioContext || window.webkitAudioContext;

//Assignments for UI elements
var audioPlayer = document.querySelector("#audio-player");
var fileInput= document.querySelector("#file-input");
var mainPlayBtn = document.querySelector("#main-play");
var mainStopBtn = document.querySelector("#main-stop");
var playbackStatus = document.querySelector("#playback-status");
var mainConsole = document.querySelector("#console");
var aboutBtn = document.querySelector("#about");
var aboutOK = document.querySelector("#about-ok");
var aboutBox = document.querySelector("#about-box");

//Keep track of file metadata
var fileSource = "";
var fileName = "";
var fileDuration = 0;

//Keep track of playback
var rate = 0;
var started = false;
var intID = 0;

// Creating event listeners 
// ************************

fileInput.addEventListener("change", setupAudio);
aboutBtn.addEventListener("click", toggleAbout);
aboutOK.addEventListener("click", toggleAbout);

// Getting the file to play
// *************************

//Loads audio file and adds it to the buffer
function setupAudio() {
    getFileInput();
    addToBuffer();
}

// Loads the audio file selected by the user
function getFileInput() {
    var files = fileInput.files;
    if (files.length > 0) {
        var file = URL.createObjectURL(files[0]); 
        audioPlayer.src = file; 
        fileSource = file;
        fileName = files[0].name;
    }

    //Update UI
    fileInput.style.display = "none";
    document.querySelector("#filename").innerHTML = fileName;
    document.querySelector("#select-new").style.display = "inline";
    mainPlayBtn.disabled = false;
}

function addToBuffer() {

    const context = new AudioContext();
    var source = context.createBufferSource();

    // Polyfill code for browsers that don't support (usually Safari)
    // Referenced an article for this code, but I can't find it - I'll add once I find it
    if (context.decodeAudioData.length !== 1) {
        const originalDecodeAudioData = context.decodeAudioData.bind(context);
        context.decodeAudioData = buffer =>
            new Promise((resolve, reject) =>
            originalDecodeAudioData(buffer, resolve, reject));
    }

    //Load the file into the audio buffer and add event listeners
    //To play/stop it
    loadSample(fileSource, context)
    .then(sample => {
        mainPlayBtn.addEventListener('click', event => {
            rate = getPlaybackSpeed();
            source = playSample(sample, rate, context);
            toggleButtons();
        });

        document.querySelector("#main-stop").addEventListener("click", function() {
            source.stop(0);
            started = false;
            clearInterval(intID);
            playbackStatus.innerHTML = "Not playing";
            toggleButtons();
        });
    })
}

//Load the sample into the buffer
function loadSample(url, context) {
    return fetch(url)
        .then(response => response.arrayBuffer())
        .then(buffer => context.decodeAudioData(buffer));
}

//Plays the audio file from the buffer
//@returns source -> updates the source in addToBuffer()
//To be used for stopping playback later on
function playSample(sample, rate, context) {
    if (started == true) {
        source.stop(0);
    }

    //Add audio buffer to the main audio source and start playback
    source = context.createBufferSource();
    source.buffer = sample;
    source.playbackRate.value = rate;
    source.connect(context.destination);
    source.start(0);

    //Update the UI with duration
    var duration = source.buffer.duration / rate;
    var mins = Math.floor(duration / 60);
    var secs = Math.floor(duration % 60);
    if (secs < 10) {secs = "0" + secs;}
    playbackStatus.innerHTML = "<span id='current-time'>0:00</span>" +" // " + mins + ":" + secs;
    trackPlayTime(Math.floor(duration));

    return source;
}

// UI Functions
// *************************

//Check the collection of radio buttons and
//See which one the user clicked
function getPlaybackSpeed() {
    var radios = document.querySelectorAll(".radio");
    var speed = 0;
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked == true) {
            switch(i) {
                case 0: speed = 0.5; break;
                case 1: speed = 0.8; break;
                case 2: speed = 1.0; break;
                case 3: speed = 1.25; break;
            }
            return speed;
        }
    }
}

//Shows the user the basic playback time
//And track duration when they hit play
function trackPlayTime(duration) {
    var count = 0;

    //Set an interval and start counting when the user
    //hits play
    intID = setInterval(function() {
        if (count < duration) {
            count++;
            var mins = Math.floor(count / 60);
            var secs = Math.floor(count % 60);
            if (secs < 10) {secs = "0" + secs;}
            document.querySelector('#current-time').innerHTML = mins + ":" + secs + " ";
        }
        else {
            toggleButtons();
            clearInterval(intID);
        }
    }, 1000);
}

//Controls when buttons are active and not
//So the playback doesn't get messed up
function toggleButtons() {
    if (mainPlayBtn.disabled == true) {
        mainPlayBtn.disabled = false;
        mainStopBtn.disabled = true;
    }
    else {
        mainPlayBtn.disabled = true;
        mainStopBtn.disabled = false;
    }
}

//Toggles display of the "About" box
function toggleAbout() {
    if (aboutBox.style.display == "block") {
        aboutBox.style.display = "none";
    }
    else {
        aboutBox.style.display = "block";
    }
}