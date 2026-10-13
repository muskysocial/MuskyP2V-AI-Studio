const $ = (id) => document.getElementById(id);
let cameraStream = null;
let referenceUrl = null;
let sourceVideoUrl = null;

function setModeCard() {
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.toggle('selected', card.querySelector('input').checked);
  });
}
document.querySelectorAll('input[name="mode"]').forEach(el => el.addEventListener('change', setModeCard));

$('referenceInput').addEventListener('change', () => {
  const file = $('referenceInput').files[0];
  if (!file) return;
  if (referenceUrl) URL.revokeObjectURL(referenceUrl);
  referenceUrl = URL.createObjectURL(file);
  $('referencePreview').src = referenceUrl;
  $('referencePreview').classList.remove('hidden');
  $('setupStatus').textContent = 'Reference photo selected. Choose a source video and check setup.';
});
$('clearReference').addEventListener('click', () => {
  $('referenceInput').value = '';
  $('referencePreview').removeAttribute('src');
  $('referencePreview').classList.add('hidden');
  if (referenceUrl) URL.revokeObjectURL(referenceUrl);
  referenceUrl = null;
});

$('videoInput').addEventListener('change', () => {
  const file = $('videoInput').files[0];
  if (!file) return;
  if (sourceVideoUrl) URL.revokeObjectURL(sourceVideoUrl);
  sourceVideoUrl = URL.createObjectURL(file);
  $('sourceVideo').src = sourceVideoUrl;
  $('sourceVideo').classList.remove('hidden');
  $('downloadOriginal').disabled = false;
  $('originalStage').innerHTML = '';
  const v = document.createElement('video');
  v.src = sourceVideoUrl; v.controls = true; v.playsInline = true;
  $('originalStage').appendChild(v);
  $('setupStatus').textContent = 'Source video selected. Check setup to see what is ready.';
});
$('clearVideo').addEventListener('click', () => {
  $('videoInput').value = '';
  $('sourceVideo').pause();
  $('sourceVideo').removeAttribute('src');
  $('sourceVideo').load();
  $('sourceVideo').classList.add('hidden');
  $('downloadOriginal').disabled = true;
  $('originalStage').innerHTML = '<span>Upload a source video or turn on your camera.</span>';
  if (sourceVideoUrl) URL.revokeObjectURL(sourceVideoUrl);
  sourceVideoUrl = null;
});

$('startCamera').addEventListener('click', async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    $('cameraStatus').textContent = 'Camera access is unavailable in this browser. Open the HTTPS site in Chrome and check permissions.';
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true});
    $('cameraPreview').srcObject = cameraStream;
    $('cameraPreview').classList.remove('hidden');
    $('startCamera').disabled = true;
    $('stopCamera').disabled = false;
    $('cameraStatus').textContent = 'Camera is on. This is the original camera feed, not an AI-transformed feed.';
    $('originalStage').innerHTML = '<span>Live original camera feed is shown above.</span>';
  } catch (err) {
    $('cameraStatus').textContent = 'Camera could not start. Allow camera/microphone permission and try again.';
  }
});
function stopCamera() {
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  cameraStream = null;
  $('cameraPreview').srcObject = null;
  $('cameraPreview').classList.add('hidden');
  $('startCamera').disabled = false;
  $('stopCamera').disabled = true;
  $('cameraStatus').textContent = 'Camera is off.';
}
$('stopCamera').addEventListener('click', stopCamera);

$('checkReady').addEventListener('click', () => {
  const hasRef = !!$('referenceInput').files[0];
  const hasVideo = !!$('videoInput').files[0];
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const modeName = mode === 'face' ? 'Face Only' : 'Full Appearance';
  if (!hasRef) {
    $('setupStatus').textContent = `Selected mode: ${modeName}. Please add a reference photo.`;
  } else if (!hasVideo && !cameraStream) {
    $('setupStatus').textContent = `Reference photo ready; mode: ${modeName}. Now upload a source video or turn on the camera.`;
  } else {
    $('setupStatus').textContent = `Your media is selected and ${modeName} mode is set. The AI engine is not connected yet, so this prototype cannot generate the transformed preview.`;
  }
});
$('downloadOriginal').addEventListener('click', () => {
  if (!sourceVideoUrl) return;
  const a = document.createElement('a');
  a.href = sourceVideoUrl;
  a.download = $('videoInput').files[0]?.name || 'musky-original-video';
  document.body.appendChild(a); a.click(); a.remove();
});

// Browser text-to-speech demo
const voiceSelect = $('voiceSelect');
function loadVoices() {
  if (!('speechSynthesis' in window)) {
    voiceSelect.innerHTML = '<option>Speech not supported in this browser</option>';
    $('speakButton').disabled = true;
    return;
  }
  const voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = '';
  if (!voices.length) {
    voiceSelect.innerHTML = '<option value="">No voices found yet — check phone text-to-speech settings</option>';
    return;
  }
  voices.forEach((voice, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${voice.name} (${voice.lang})${/female/i.test(voice.name) ? ' • may be female' : ''}`;
    voiceSelect.appendChild(opt);
  });
  const preferred = voices.findIndex(v => /female|woman|zira|samantha|aria/i.test(v.name));
  if (preferred >= 0) voiceSelect.value = String(preferred);
}
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}
$('voiceRate').addEventListener('input', () => $('rateValue').textContent = Number($('voiceRate').value).toFixed(1));
$('speakButton').addEventListener('click', () => {
  if (!('speechSynthesis' in window)) return;
  const text = $('speechText').value.trim();
  if (!text) { $('speechText').focus(); return; }
  speechSynthesis.cancel();
  const voices = speechSynthesis.getVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  const selected = Number(voiceSelect.value);
  if (voices[selected]) utterance.voice = voices[selected];
  utterance.rate = Number($('voiceRate').value);
  speechSynthesis.speak(utterance);
});
$('stopSpeech').addEventListener('click', () => {
  if ('speechSynthesis' in window) speechSynthesis.cancel();
});
window.addEventListener('beforeunload', () => {
  stopCamera();
  if (referenceUrl) URL.revokeObjectURL(referenceUrl);
  if (sourceVideoUrl) URL.revokeObjectURL(sourceVideoUrl);
});
