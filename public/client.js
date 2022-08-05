const socket = io.connect("http://localhost:4000");

const videoChatLobbyEl = document.getElementById("video-chat-lobby");
const videoChatRoomEl = document.getElementById("video-chat-romm");
const joinButton = document.getElementById("join");
const userVideo = document.getElementById("user-video");
const peerVideo = document.getElementById("peer-video");
const roomInput = document.getElementById("roomName");

let hasCreated = false;

const rtcConfig = { audio: true, video: { width: 1280, heigth: 720 } };

const iceServers = {
  iceServers: [
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
  ],
};

let rtcPeerConnection;
let userStream;

joinButton.addEventListener("click", () => {
  if (roomInput.value === "") {
    alert("Please enter a room name");
  } else {
    socket.emit("join", roomInput.value);
  }
});

socket.on("created", () => {
  hasCreated = true;

  navigator.mediaDevices
    .getUserMedia(rtcConfig)
    .then((stream) => {
      userStream = stream;
      videoChatLobbyEl.style = "display:none";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = (e) => {
        userVideo.play();
      };
    })
    .catch((err) => {
      alert("Couldn't access user media", err);
    });
});

socket.on("joined", () => {
  hasCreated = false;

  navigator.mediaDevices
    .getUserMedia(rtcConfig)
    .then((stream) => {
      userStream = stream;
      videoChatLobbyEl.style = "display:none";
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = (e) => {
        userVideo.play();
      };
      socket.emit("ready", roomInput.value);
    })
    .catch((err) => {
      alert("Couldn't access user media", err);
    });
});

socket.on("full", () => {
  alert("Room Is Full!");
});

socket.on("ready", () => {
  if (hasCreated) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onTrack;
    // audio track
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    // video track
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

    rtcPeerConnection.setRemoteDescription(answer);

    rtcPeerConnection.createOffer(
      (offer) => {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomInput.value);
      },
      (err) => {}
    );
  }
});

socket.on("candidate", () => {
  let iceCandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(iceCandidate);
});

socket.on("offer", (offer) => {
  if (!hasCreated) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onTrack;
    // audio track
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    // video track
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

    rtcPeerConnection.setRemoteDescription(offer);

    rtcPeerConnection.createAnswer(
      (answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomInput.value);
      },
      (err) => {}
    );
  }
});

socket.on("answer", (answer) => {});

function onIceCandidate(event) {
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomInput.value);
  }
}

function onTrack(event) {
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = (e) => {
    peerVideo.play();
  };
}
