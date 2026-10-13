// MuskyP2V AI Studio — free browser prototype.
// Demo sign-in and coins are NOT secure. No AI face transformation, payment processing,
// or voice cloning is implemented in this version.
const $ = (id) => document.getElementById(id);
const loginPanel = $("loginPanel");
const studio = $("studio");
const loginForm = $("loginForm");
const userName = $("userName");
const welcomeName = $("welcomeName");
const signOut = $("signOut");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = userName.value.trim();
  if (!name) return;
  welcomeName.textContent = name;
  loginPanel.hidden = true;
  studio.hidden = false;
  refreshVoices();
});
signOut.addEventListener("click", () => {
  stopSpeech();
  studio.hidden = true;
  loginPanel.hidden = false;
  userName.value = "";
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t === tab));
    document.querySelectorAll(".pane").forEach(p => p.hidden = p.id !== tab.dataset.target);
  });
});

let cameraStream = null;
let facingMode = "user";
let videoRecorder = null;
let videoChunks = [];
let audioRecorder = null;
let audioChunks = [];
let activeAudioStream = null;
let currentObjectUrls = [];

function makeUrl(blob) {
  const url = URL.createObjectURL(blob);
  currentObjectUrls.push(url);
  return url;
}
function cleanupUrls() {
  currentObjectUrls.forEach(url => URL.revokeObjectURL(url));
  currentObjectUrls = [];
}

$("referenceImage").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (file) $("referencePreview").src = makeUrl(file);
});

async function openCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    $("cameraStatus").textContent = "Camera access is unavailable. Open the published site using HTTPS in a supported browser.";
    return;
  }
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true });
    $("cameraVideo").srcObject = cameraStream;
    $("cameraStatus").textContent = "Camera is on. This is the normal camera feed; AI transformation is not connected yet.";
    $("startVideoRecord").disabled = false;
  } catch (error) {
    $("cameraStatus").textContent = "Could not open camera/microphone. Check browser permissions and try again. (" + error.name + ")";
  }
}
$("startCamera").addEventListener("click", openCamera);
$("switchCamera").addEventListener("click", async () => {
  facingMode = facingMode === "user" ? "environment" : "user";
  await openCamera();
});

$("startVideoRecord").addEventListener("click", () => {
  if (!cameraStream || !window.MediaRecorder) return;
  videoChunks = [];
  const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
  try {
    videoRecorder = new MediaRecorder(cameraStream, { mimeType: mime });
    videoRecorder.ondataavailable = e => { if (e.data.size) videoChunks.push(e.data); };
    videoRecorder.onstop = () => {
      const blob = new Blob(videoChunks, { type: videoRecorder.mimeType || "video/webm" });
      const url = makeUrl(blob);
      $("videoDownload").href = url;
      $("videoDownload").download = "muskyp2v-recording.webm";
      $("videoDownload").textContent = "Download recorded video";
      $("videoDownload").hidden = false;
      $("cameraStatus").textContent = "Recording is ready. Tap the download link to save it to your device.";
    };
    videoRecorder.start();
    $("startVideoRecord").disabled = true;
    $("stopVideoRecord").disabled = false;
    $("cameraStatus").textContent = "Recording…";
  } catch (error) {
    $("cameraStatus").textContent = "Recording is not supported by this browser: " + error.message;
  }
});
$("stopVideoRecord").addEventListener("click", () => {
  if (videoRecorder && videoRecorder.state !== "inactive") videoRecorder.stop();
  $("startVideoRecord").disabled = !cameraStream;
  $("stopVideoRecord").disabled = true;
});

$("audioUpload").addEventListener("change", (event) => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  $("audioPreview").src = makeUrl(file);
  $("audioPreview").hidden = false;
  $("audioStatus").textContent = "Audio loaded for local preview; it has not been uploaded.";
});

$("startAudioRecord").addEventListener("click", async () => {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    $("audioStatus").textContent = "Audio recording is not supported in this browser.";
    return;
  }
  try {
    activeAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    audioRecorder = new MediaRecorder(activeAudioStream);
    audioRecorder.ondataavailable = e => { if (e.data.size) audioChunks.push(e.data); };
    audioRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: audioRecorder.mimeType || "audio/webm" });
      const url = makeUrl(blob);
      $("audioPreview").src = url;
      $("audioPreview").hidden = false;
      $("audioDownload").href = url;
      $("audioDownload").download = "muskyp2v-voice-sample.webm";
      $("audioDownload").textContent = "Download voice sample";
      $("audioDownload").hidden = false;
      $("audioStatus").textContent = "Voice sample recorded. Download it to keep a copy.";
      activeAudioStream?.getTracks().forEach(track => track.stop());
      activeAudioStream = null;
    };
    audioRecorder.start();
    $("startAudioRecord").disabled = true;
    $("stopAudioRecord").disabled = false;
    $("audioStatus").textContent = "Recording voice sample…";
  } catch (error) {
    $("audioStatus").textContent = "Could not access microphone. Check browser permission. (" + error.name + ")";
  }
});
$("stopAudioRecord").addEventListener("click", () => {
  if (audioRecorder && audioRecorder.state !== "inactive") audioRecorder.stop();
  $("startAudioRecord").disabled = false;
  $("stopAudioRecord").disabled = true;
});

// Free text-to-speech using voices already installed/available in the browser or operating system.
const voiceSelect = $("voiceSelect");
const voiceStyle = $("voiceStyle");
let availableVoices = [];

function refreshVoices() {
  if (!("speechSynthesis" in window)) {
    voiceSelect.innerHTML = '<option value="">Speech synthesis not supported</option>';
    $("speechStatus").textContent = "This browser does not support built-in text-to-speech. Try an updated Chrome browser.";
    $("speakButton").disabled = true;
    return;
  }
  availableVoices = window.speechSynthesis.getVoices() || [];
  const previous = voiceSelect.value;
  const filter = voiceStyle.value;
  let list = availableVoices.slice();
  if (filter === "female") {
    // Voice gender metadata is not consistently provided; use name hints only as a preference.
    const likelyFemale = list.filter(v => /female|woman|samantha|victoria|karen|moira|tessa|zira|aria|jenny|sara|ava|emma|olivia|susan|salli|joanna|kimberly|ivy|kendra|linda|amy/i.test(v.name));
    if (likelyFemale.length) list = likelyFemale;
  } else if (filter === "english") {
    const english = list.filter(v => /^en([_-]|$)/i.test(v.lang));
    if (english.length) list = english;
  }
  voiceSelect.innerHTML = "";
  if (!list.length) {
    voiceSelect.add(new Option("No voices detected yet — wait or reload", ""));
    $("speechStatus").textContent = "No voices are available yet. On some phones, you may need to enable or install speech services in device settings.";
    return;
  }
  list.sort((a,b) => a.name.localeCompare(b.name));
  list.forEach(v => voiceSelect.add(new Option(`${v.name} — ${v.lang}${v.default ? " (default)" : ""}`, v.voiceURI)));
  if (previous && list.some(v => v.voiceURI === previous)) voiceSelect.value = previous;
  else {
    const preferred = list.find(v => /en/i.test(v.lang)) || list[0];
    voiceSelect.value = preferred.voiceURI;
  }
  $("speechStatus").textContent = `${list.length} voice option(s) available on this device. Voice realism depends on the installed voice engine.`;
}
if ("speechSynthesis" in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}
voiceStyle.addEventListener("change", refreshVoices);
$("speechRate").addEventListener("input", () => $("rateValue").textContent = `${Number($("speechRate").value).toFixed(2).replace(/0$/, "")}×`);
$("speechPitch").addEventListener("input", () => $("pitchValue").textContent = Number($("speechPitch").value).toFixed(2).replace(/0$/, ""));

function stopSpeech() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
$("speakButton").addEventListener("click", () => {
  const text = $("speechText").value.trim();
  if (!text) {
    $("speechStatus").textContent = "Type some text first.";
    return;
  }
  if (!("speechSynthesis" in window)) {
    $("speechStatus").textContent = "Built-in text-to-speech is not supported in this browser.";
    return;
  }
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  const chosen = availableVoices.find(v => v.voiceURI === voiceSelect.value);
  if (chosen) utterance.voice = chosen;
  utterance.rate = Number($("speechRate").value);
  utterance.pitch = Number($("speechPitch").value);
  utterance.onstart = () => $("speechStatus").textContent = "Speaking…";
  utterance.onend = () => $("speechStatus").textContent = "Finished. Choose another voice or change the speed and try again.";
  utterance.onerror = e => $("speechStatus").textContent = `Speech error: ${e.error || "unknown error"}. Try another available voice.`;
  window.speechSynthesis.speak(utterance);
});
$("pauseSpeech").addEventListener("click", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.pause();
});
$("resumeSpeech").addEventListener("click", () => {
  if ("speechSynthesis" in window) window.speechSynthesis.resume();
});
$("stopSpeech").addEventListener("click", () => {
  stopSpeech();
  $("speechStatus").textContent = "Speech stopped.";
});

$("saveText").addEventListener("click", () => {
  try {
    localStorage.setItem("muskyp2v-speech-text", $("speechText").value);
    $("textStatus").textContent = "Text saved in this browser on this device.";
  } catch {
    $("textStatus").textContent = "Could not save text in this browser.";
  }
});
try {
  $("speechText").value = localStorage.getItem("muskyp2v-speech-text") || $("speechText").value;
} catch {}

window.addEventListener("beforeunload", () => {
  stopSpeech();
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  if (activeAudioStream) activeAudioStream.getTracks().forEach(track => track.stop());
  cleanupUrls();
});
