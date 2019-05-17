var isTimer = false;
var port = null;

var canvasCircle, ctxCircle, canvasProgress, ctxProgress;
var globalIsBreak;
var globalIsPause;


chrome.runtime.onMessage.addListener(
  function (req, sender, sendResponse) {
    if (req.answer === "getTimerState") {
      $('#breaks-count').text(req.data.currentTime);
      // sendResponse({farewell: "goodbye"});
      updateTimerData(req.data);
      updateCircle(req.data);
      updateProgress(req.data);
      console.log(req.data)
    } else if (req.answer === "discardTimer") {
      updateTimerData();
      oldEndAngle = 0;
      ctxCircle.clearRect(0, 0, canvasCircle.width, canvasCircle.height);
      ctxProgress.clearRect(0, 0, canvasProgress.width, canvasProgress.height);
      $('#play-btn').css("backgroundImage", `url('images/${!globalIsPause ? 'pause' : 'play'}_${globalIsBreak ? 'break' : 'work'}_normal.png')`);
      $('#timer').css('color', '#5D8EE4');
      $('#workOrBreakLabel').text("Let's go");
      $('#allBreaks').text('0/0');
      $('#timer').text('00:00')
      $('#progressPersent').text('0%')
    } else if (req.answer === "endTimer") {
      updateTimerData();
      oldEndAngle = 0;
      ctxCircle.clearRect(0, 0, canvasCircle.width, canvasCircle.height);
      $('#play-btn').css("backgroundImage", `url('images/${!globalIsPause ? 'pause' : 'play'}_${globalIsBreak ? 'break' : 'work'}_normal.png')`);
      $('#timer').css('color', '#5D8EE4');
      $('#workOrBreakLabel').text("You're all set");
      $('#allBreaks').text('0/0');
      $('#timer').text('00:00')
    }
  });

// document.addEventListener('DOMContentLoaded', function () {
//   document.querySelector('#play-button').addEventListener('click', alerm);
// });

$(document).ready(function () {
  port = chrome.runtime.connect({
    name: "backGroundTimer"
  });
  restoreSettings();
  drawClock();
  drawGenProgress();
  $('#play-btn').on('click', toggleClock);
  $('#discard-btn').on('click', discardClock);
  $('#settings-btn').on('click', displaySettings);
  $('#save-settings-btn').on('click', saveSettings);

  port.onMessage.addListener(function (msg) {
    if (msg.answer === "getTimer") {
      if (msg.data.isTimer) {
        $('#breaks-count').text('Timer in use!');
      } else {
        $('#breaks-count').text('No Timer!');
      }
    } else if (msg.answer === "stopTimer") {
      $('#breaks-count').text('Timer is stoped');
    } else if (msg.answer === "pauseTimer") {
      $('#breaks-count').text('Timer is paused');
    } else if (msg.answer === "startTimer") {
      $('#breaks-count').text('Timer is start');
    }
    updateTimerData(msg.data);
    $('#play-btn').css("backgroundImage", `url('images/${!globalIsPause ? 'pause' : 'play'}_${globalIsBreak ? 'break' : 'work'}_normal.png')`);
  });

  getTimerInfoFromBackground();

});

function updateTimerData(data) {
  isTimer = data.isTimer;
  globalIsBreak = data.isBreak;
  globalIsPause = data.isPause;
}

function getTimerInfoFromBackground() {
  port.postMessage({
    cmd: 'getTimer'
  });
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
    cmd: "stopTimer"
  });
  isTimer = false;
}

function displaySettings() {
  $('#settingsView').toggleClass('show');
}
// document.querySelector('#go-to-options').addEventListener("click", function () {
//   if (chrome.runtime.openOptionsPage) {
//     chrome.runtime.openOptionsPage();
//   } else {
//     window.open(chrome.runtime.getURL('options.html'));
//   }
// });

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

function timerView(strings, minutesExp, secondsExp) {
  let str0 = strings[1]; // ":"

  if (minutesExp.toString().length < 2)
    minutesExp = '0' + minutesExp;
  if (secondsExp.toString().length < 2)
    secondsExp = '0' + secondsExp;

  return `${minutesExp}${str0}${secondsExp}`;
}

// var oldEndAngle = 0;
function updateCircle(data) {

  if (data.isBreak) {
    $('#timer').css('color', '#C4D141');
    $('#workOrBreakLabel').text('Break Time');
  } else {
    $('#timer').css('color', '#5D8EE4');
    $('#workOrBreakLabel').text('Work Time');
  }

  $('#currentRepeat').text(data.amountOfRepeats);
  $('#allRepeats').text(`/${data.workRepeats}`);
  $('#timer').text(timerView`${Math.floor(data.currentTime / 60) % 60}:${data.currentTime % 60}`)

  $('#play-btn').css("backgroundImage", `url('images/${!data.isPause ? 'pause' : 'play'}_${data.isBreak ? 'break' : 'work'}_normal.png')`);

  let currentEndAngle = ((Math.PI * 2) / data.currentTimerTime) * ((data.currentTime <=0) ? 0 : (data.currentTime - 1));
  let finalEndAngle = ((Math.PI * 2) / data.currentTimerTime) * data.currentTime;

  console.log(currentEndAngle, finalEndAngle)

  requestAnimationFrame(function animateTik() {

    ctxCircle.clearRect(0, 0, canvasCircle.width, canvasCircle.height);

    ctxCircle.beginPath();
    // console.log(allTime, '---', currentTime)
    ctxCircle.arc(canvasCircle.width / 2, canvasCircle.height / 2, (canvasCircle.width / 2) - 3, 0, currentEndAngle);
    ctxCircle.lineWidth = 4;
    ctxCircle.strokeStyle = data.isBreak ? '#C4D141' : '#5D8EE4';
    ctxCircle.stroke();

    ctxCircle.beginPath();
    ctxCircle.arc(canvasCircle.width / 2, canvasCircle.height / 2, (canvasCircle.width / 2) - 16, currentEndAngle - 0.01, currentEndAngle + 0.01);
    ctxCircle.lineWidth = 29;
    ctxCircle.stroke();

    currentEndAngle = currentEndAngle + (Math.PI * 2 / data.currentTimerTime / 50);
    if (finalEndAngle >= currentEndAngle && isTimer)
      requestAnimationFrame(animateTik);

    if (!isTimer && !globalIsPause)
      ctxCircle.clearRect(0, 0, canvasCircle.width, canvasCircle.height);
  })

}

function updateProgress(data) {

  // ctxProgress.clearRect(0, 0, canvasProgress.width, canvasProgress.height);

  let progress = (data.currentAllTime / data.allTime);
  ctxProgress.beginPath();
  ctxProgress.moveTo(0, canvasProgress.height / 2);
  ctxProgress.lineTo(progress * canvasProgress.width, canvasProgress.height / 2);
  ctxProgress.lineWidth = 15;
  ctxProgress.strokeStyle = '#C8D356'; // pik color = #ABAF57
  ctxProgress.stroke();

  $('#progressPersent').text(`${Math.floor(progress * 100)}%`)

}

// Saves settings to chrome.storage
function saveSettings() {

  let workTime = $('#workTime').val();
  let workRepeats = $('#workRepeats').val();
  let shortBreak = $('#shortBreak').val();
  let longBreak = $('#longBreak').val();
  let longBreakAfter = $('#longBreakAfter').val();
  let showNotifications = $('#showNotifications').is(':checked');

  chrome.storage.sync.set({
    workTime: workTime,
    workRepeats: workRepeats,
    shortBreak: shortBreak,
    longBreak: longBreak,
    longBreakAfter: longBreakAfter,
    showNotifications: showNotifications
  }, function () {
    $('#settingsView').toggleClass('show');
    // // Update status to let user know options were saved.
    // var status = document.getElementById('status');
    // status.textContent = 'Options saved.';
    // setTimeout(function() {
    //   status.textContent = '';
    // }, 750);
  });
}

// Restores settings using the preferences stored in chrome.storage.
function restoreSettings() {
  // Use default values
  chrome.storage.sync.get({
    workTime: 0.25,
    workRepeats: 5,
    shortBreak: 0.125,
    longBreak: 0.25,
    longBreakAfter: 2,
    showNotifications: true
  }, function (items) {
    $('#workTime').val(items.workTime);
    $('#workRepeats').val(items.workRepeats);
    $('#shortBreak').val(items.shortBreak);
    $('#longBreak').val(items.longBreak);
    $('#longBreakAfter').val(items.longBreakAfter);
    $('#showNotifications').prop('checked', items.showNotifications);
  });
}