'use strict';

const startButton = document.getElementById('startButton');
const answerButton = document.getElementById('answerButton');
const hangupButton = document.getElementById('hangupButton');
hangupButton.disabled = true;
startButton.addEventListener('click', start);
answerButton.addEventListener('click', answer);
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
let pc2;
let ices = [];
const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

async function start() {

  document.getElementById('logs').innerHTML = '<div>start</div>';

  
  console.log('Requesting local stream');
  startButton.disabled = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: true});
    console.log('Received local stream');
    localVideo.srcObject = stream;
    console.log('Received local stream 2');
    localStream = stream;
    console.log('Received local stream 3');
  } catch (e) {
    alert(`getUserMedia() error: ${e.name}`);
    console.error(e)
  }
}

async function answer() {
  document.getElementById('logs').innerHTML = '<div>start</div>';
  console.log("answer");
  answerButton.disabled = true;
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
  pc2 = new RTCPeerConnection(configuration);
  console.log('Created local peer connection object pc2');
  pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
  pc2.addEventListener('iceconnectionstatechange', e => onIceStateChange(pc2, e));
  pc2.addEventListener('track', gotRemoteStream);
  localStream.getTracks().forEach(track => pc2.addTrack(track, localStream));
  var remoteDesc = window.prompt("Input desc");
  console.log('pc2 setRemoteDescription start');
  console.log(JSON.parse(remoteDesc));
  try {
    await pc2.setRemoteDescription(JSON.parse(remoteDesc));
    console.log(`setRemoteDescription complete`);
  } catch (e) {
    console.log(`Failed to set session description: ${e}`);
  }

  console.log('pc2 createAnswer start');
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  try {
    const answer = await pc2.createAnswer();
    await onCreateAnswerSuccess(answer);
  } catch (e) {
    console.log(`Failed to create session description: ${e}`);
  }
}

function onCreateSessionDescriptionError(error) {
  console.log(`Failed to create session description: ${error.toString()}`);
}

async function onCreateOfferSuccess(desc) {
  console.log(`Offer from pc1\n${desc.sdp}`);
  console.log('pc2 setLocalDescription start');
  try {
    await pc2.setLocalDescription(desc);
    onSetLocalSuccess(pc2);
  } catch (e) {
    onSetSessionDescriptionError();
  }

  alert(desc);
}

async function onCreateAnswerSuccess(desc) {
  console.log(`Answer from pc2:\n${desc.sdp}`);
  console.log('pc2 setLocalDescription start');
  try {
    await pc2.setLocalDescription(desc);
    console.log(`pc2 setLocalDescription complete`);
  } catch (e) {
    console.log(`Failed to set session description: ${e.toString()}`);
  }
  document.getElementById('logs').innerHTML = '<div>'+`pc2 answer <pre>${JSON.stringify(desc)}</pre>`+'</div>';
}

function onSetSessionDescriptionError(error) {
  console.log(`Failed to set session description: ${error.toString()}`);
}

async function onIceCandidate(pc, event) {
  try {
    console.log(event.candidate);
    ices += event.candidate.toJSON();
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
    console.log(ices[i])
    try { await pc2.addIceCandidate(ices[i]); }
    catch (e) {console.log(`failed adding ice: ${e}`);}
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

function onIceStateChange(pc, event) {
  if (pc) {
    console.log(`pc2 ICE state: ${pc.iceConnectionState}`);
    console.log('ICE state change event: ', event);
  }
}
function gotRemoteStream(e) {
  if (remoteVideo.srcObject !== e.streams[0]) {
    remoteVideo.srcObject = e.streams[0];
    console.log('pc2 received remote stream');
  }
}
function hangup() {
  console.log('Ending call');
  pc2.close();
  pc2 = null;
  hangupButton.disabled = true;
  answerButton.disabled = false;
}

