'use strict';

const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.addEventListener('click', start);
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);


let startTime;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

localVideo.addEventListener('loadedmetadata', function() {
  console.log(`Local video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

remoteVideo.addEventListener('loadedmetadata', function() {
  console.log(`Remote video videoWidth: ${this.videoWidth}px,  videoHeight: ${this.videoHeight}px`);
});

let localStream;
let pc1;
let ices = [];
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

async function start() {
  console.log('Requesting local stream');
  startButton.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    console.log('Received local stream');
    localVideo.srcObject = stream;
    console.log('Received local stream 2');
    localStream = stream;
    console.log('Received local stream 3');
    callButton.disabled = false;
  } catch (e) {
    alert(`getUserMedia() error: ${e.name}`);
  }
}

async function call() {
  console.log("call");
  callButton.disabled = true;
  hangupButton.disabled = false;
  console.log('Starting call');
  startTime = window.performance.now();
  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}`);
  }
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}`);
  }
  const configuration = {};
  console.log('RTCPeerConnection configuration:', configuration);
  pc1 = new RTCPeerConnection(configuration);
  pc1.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc1, e));

  console.log('Created local peer connection object pc1');
  pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
  pc1.addEventListener('track', gotRemoteStream);
  localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));
  console.log('Added local stream to pc1');

  try {
    console.log('pc1 createOffer start');
    const offer = await pc1.createOffer(offerOptions);
    await onCreateOfferSuccess(offer);
  } catch (e) {
    onCreateSessionDescriptionError(e);
  }  
}

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

async function onCreateOfferSuccess(desc) {
  console.log('pc1 setLocalDescription start');
  try {
    await pc1.setLocalDescription(desc);
    console.log(`pc1 setLocalDescription complete`);
  } catch (e) {
    console.log(`Failed to set session description: ${error.toString()}`);
  }

  document.getElementById('logs').innerHTML += '<div>'+`Input desc in remote <pre>${JSON.stringify(desc)}</pre>`+'</div>';
  document.getElementById('logs').innerHTML += '<input id="pc2answer"></input><button onclick="setRemote()">setRemote</button>';}

async function setRemote(desc) {
  var pc2Answer = document.getElementById('pc2answer').value;
  console.log('pc1 setRemoteDescription start');
  try {
    await pc1.setRemoteDescription(JSON.parse(pc2Answer));

    console.log(`pc1 setRemoteDescription complete`);
  } catch (e) {
    console.log(`Failed to set session description: ${e.toString()}`);
  }
}


async function onIceCandidate(pc, event) {
  try {
    console.log(event.candidate.toJSON());
    if (event.candidate) {
      ices.push(event.candidate);
    }
    console.log(ices.length, ices);
    document.getElementById('ices').innerHTML = '<div>'+`ICE Candidates <pre>${JSON.stringify(ices)}</pre>`+'</div>';
    console.log(`addIceCandidate success`);
  } catch (e) {
    console.log(`Failed to add ICE Candidate: ${e.toString()}`);
  }
  console.log(`ICE candidate:\n${event.candidate ? event.candidate.candidate : '(null)'}`);
}



async function addIces() {
  let ices = JSON.parse(document.getElementById('remoteIces').value);
  for (let i=0;i<ices.length;i++) {
    try { await pc1.addIceCandidate(ices[i]); }
    catch (e) {console.log(`failed adding ice: ${e}`);}
	       
  }
}

function onIceStateChange(pc, event) {
  if (pc) {
    console.log(`pc1 ICE state: ${pc.iceConnectionState}`);
    console.log('ICE state change event: ', event);
  }
}

function gotRemoteStream(e) {
  console.log("remote stream")
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0];
    console.log('pc2 received remote stream');
  }
}

function hangup() {
  console.log('Ending call');
  pc1.close();
  pc1 = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
}
