var isTimer = false;
var port = null;

var canvasCircle, ctxCircle, canvasProgress, ctxProgress;
var globalIsBreak;
var globalIsPause;
var discardTimerFlag = false;


chrome.runtime.onMessage.addListener(
  function (req, sender, sendResponse) {
    updateTimerData(req.data);
    if (req.answer === "getTimerState") {
      updateCircle(req.data);
      updateProgress(req.data);
    } else if (req.answer === "endTimer") {
      ctxCircle.clearRect(0, 0, canvasCircle.width, canvasCircle.height);
      drawGenProgress()
      $('#play-btn').css("backgroundImage", `url('images/${!globalIsPause ? 'pause' : 'play'}_${globalIsBreak ? 'break' : 'work'}_normal.png')`);
      $('#timer').css('color', '#5D8EE4');
      $('#workOrBreakLabel').text("You're all set");
      $('#currentRepeat').text('0');
      $('#allRepeats').text('/0');
      $('#timer').text('00:00:00')
    }
    sendResponse({answer:"ok"});
  });

$(document).ready(() => {

  drawClock();
  drawGenProgress();
  getTimerInfoFromBackground();

  port = chrome.runtime.connect({
    name: "backGroundTimer"
  });
  $('#play-btn').on('click', toggleClock);
  $('#discard-btn').on('click', discardClock);
  $('#settings-btn').on('click', displaySettings);

  port.onMessage.addListener((msg) => {
    updateTimerData(msg.data);
    if (msg.answer === "discardTimer") {
      discardTimerFlag = true;
      ctxCircle.clearRect(0, 0, canvasCircle.width, canvasCircle.height);
      // updateCircle(msg.data);
      drawGenProgress();
      $('#timer').css('color', '#5D8EE4');
      $('#workOrBreakLabel').text("Let's go");
      $('#currentRepeat').text('0');
      $('#allRepeats').text('/0');
      $('#timer').text('00:00:00')
      $('#progressPersent').text('0%')
    }
  });

});

//Create addition connection port for detection in service-worker side, that popup visible or not
document.addEventListener('DOMContentLoaded', () => {
  const port = chrome.runtime.connect({ name: 'popup' });
});

function updateTimerData(data) {
  isTimer = data.isTimer;
  globalIsBreak = data.isBreak;
  globalIsPause = data.isPause;
  $('#play-btn').css("backgroundImage", `url('images/${!globalIsPause ? 'pause' : 'play'}_${globalIsBreak ? 'break' : 'work'}_normal.png')`);
}

function getTimerInfoFromBackground() {
  chrome.runtime.sendMessage({
    msg: 'getTimer'
  }, (res) => {
    updateTimerData(res.data);
    updateCircle(res.data);
    updateProgress(res.data);
    if (res.data.allTime === 0) {
      $('#workOrBreakLabel').text("Let's go");
      $('#progressPersent').text('0%')
    }
  })
}

function toggleClock() {
  if (globalIsPause) {
    port.postMessage({
      cmd: "startTimer"
    });
  } else {
    port.postMessage({
      cmd: "pauseTimer"
    })
  }
  $('#play-btn').css("backgroundImage", `url('images/${!globalIsPause ? 'pause' : 'play'}_${globalIsBreak ? 'break' : 'work'}_normal.png')`);
}

function discardClock() {
  port.postMessage({
    cmd: "discardTimer"
  });
}

function displaySettings() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options-page/options.html'));
  }

  // $('#settingsView').toggleClass('show');
}

function drawClock() {
  canvasCircle = document.getElementById("clock")
  ctxCircle = canvasCircle.getContext("2d");

  canvasCircle.width = 284;
  canvasCircle.height = 284;

  // Rotate ctxCircle, for make circle drawing like a watch
  ctxCircle.translate(0, canvasCircle.height);
  ctxCircle.rotate(-90 * Math.PI / 180);
}

function drawGenProgress() {
  canvasProgress = document.getElementById("genProgress")
  ctxProgress = canvasProgress.getContext("2d");

  canvasProgress.width = 330;
  canvasProgress.height = 30;

  ctxProgress.beginPath();
  ctxProgress.moveTo(0, canvasProgress.height / 2);
  ctxProgress.lineTo(canvasProgress.width, canvasProgress.height / 2);
  ctxProgress.lineWidth = 15;
  ctxProgress.strokeStyle = '#aabcbe';
  ctxProgress.stroke();
}

function timerView(strings, hoursExp, minutesExp, secondsExp) {

  if (hoursExp.toString().length < 2)
    hoursExp = '0' + hoursExp;
  if (minutesExp.toString().length < 2)
    minutesExp = '0' + minutesExp;
  if (secondsExp.toString().length < 2)
    secondsExp = '0' + secondsExp;

  return `${hoursExp}:${minutesExp}:${secondsExp}`;
}

function updateCircle(data) {

  if (data.isBreak) {
    $('#timer').css('color', '#C4D141');
    $('#workOrBreakLabel').text('Break Time');
  } else {
    $('#timer').css('color', '#5D8EE4');
    $('#workOrBreakLabel').text('Work Time');
  }

  let timeDifference = data.currentTimerTime - data.currentTime;

  $('#currentRepeat').text(data.amountOfRepeats);
  $('#allRepeats').text(`/${data.workRepeats}`);
  $('#timer').text(timerView`${Math.floor(timeDifference / 60 / 60) % 60}:${Math.floor(timeDifference / 60) % 60}:${timeDifference % 60}`)

  $('#play-btn').css("backgroundImage", `url('images/${!data.isPause ? 'pause' : 'play'}_${data.isBreak ? 'break' : 'work'}_normal.png')`);

  let currentEndAngle = ((Math.PI * 2) / data.currentTimerTime) * ((data.currentTime <= 0) ? 0 : (data.currentTime - 1));
  let finalEndAngle = ((Math.PI * 2) / data.currentTimerTime) * data.currentTime;

  requestAnimationFrame(function animateTik() {

    ctxCircle.clearRect(0, 0, canvasCircle.width, canvasCircle.height);

    ctxCircle.beginPath();
    ctxCircle.arc(canvasCircle.width / 2, canvasCircle.height / 2, (canvasCircle.width / 2) - 3, 0, currentEndAngle);
    ctxCircle.lineWidth = 4;
    ctxCircle.strokeStyle = data.isBreak ? '#C4D141' : '#5D8EE4';
    ctxCircle.stroke();

    ctxCircle.beginPath();
    ctxCircle.arc(canvasCircle.width / 2, canvasCircle.height / 2, (canvasCircle.width / 2) - 16, currentEndAngle - 0.01, currentEndAngle + 0.01);
    ctxCircle.lineWidth = 29;
    ctxCircle.stroke();

    currentEndAngle = currentEndAngle + (Math.PI * 2 / data.currentTimerTime / 50);
    if (finalEndAngle >= currentEndAngle && ((globalIsPause && !isTimer) || (!globalIsPause && isTimer))) {
      requestAnimationFrame(animateTik);
    }
    else if (discardTimerFlag) {
      ctxCircle.clearRect(0, 0, canvasCircle.width, canvasCircle.height);
      discardTimerFlag = false;
    }
  })

}

function updateProgress(data) {
  let progress = (data.currentAllTime / data.allTime);
  ctxProgress.beginPath();
  ctxProgress.moveTo(0, canvasProgress.height / 2);
  ctxProgress.lineTo(progress * canvasProgress.width, canvasProgress.height / 2);
  ctxProgress.lineWidth = 15;
  ctxProgress.strokeStyle = '#C8D356'; // pik color = #ABAF57
  ctxProgress.stroke();

  $('#progressPersent').text(`${Math.floor(progress * 100)}%`)
}