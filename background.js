var workTime = 0,
  workRepeats = 0,
  shortBreak = 0,
  longBreak = 0,
  longBreakAfter = 0,
  currentTime = 0,
  currentTimerTime = 0,
  amountOfLongBreaks = 0,
  currentAllTime = 0,
  allTime = 0,
  amountOfRepeats = 0,
  showNotifications,
  isBreak = false,
  isPause = true,
  timer = null

function restoreSettings() {
  // Use default values
  chrome.storage.sync.get({
    workTime: 0.25 * 60,
    workRepeats: 5,
    shortBreak: 0.125 * 60,
    longBreak: 0.25 * 60,
    longBreakAfter: 2,
    showNotifications: true 
  }, function (items) {
    workTime = items.workTime * 60;
    workRepeats = items.workRepeats;
    shortBreak = items.shortBreak * 60;
    longBreak = items.longBreak * 60;
    longBreakAfter = items.longBreakAfter;
    showNotifications = items.showNotifications;
    amountOfLongBreaks = calcAmountOfLongBreaks();
    allTime = calcAllTime();
  });
}

function calcAmountOfLongBreaks() {
  let amount = 0
  if (workRepeats <= longBreakAfter) {
    return amount;
  } else {
    if (workRepeats % longBreakAfter == 0) {
      amount = workRepeats / longBreakAfter - 1;
    } else {
      amount = workRepeats / longBreakAfter;
    }
  }
  console.log(amount)
  return amount;
}

function calcAllTime() {
  let allTime = workTime * workRepeats + amountOfLongBreaks * longBreak +
    shortBreak * ((workRepeats - amountOfLongBreaks) - 1);
  return allTime;
}

function startTimer() {
  if (allTime === 0)
    restoreSettings();

  isPause = false;
  timer = setInterval(update, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  timer = null;
  isPause = true;
  // sendDataToPopup();
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
  isPause = false;
  isBreak = true;
  currentTime = 0;
  currentAllTime = 0;
  currentTimerTime = 0;
  amountOfRepeats = 0;
  amountOfLongBreaks = 0;
  allTime = 0;
  sendDataToPopup('discard');
  chrome.browserAction.setIcon({ path: `icons/icon-inactive-32.png` });
}


function update() {
  console.log(getTimerData())
  if (currentTime >= currentTimerTime) {
    currentTime = 1;
    if (amountOfRepeats >= workRepeats) {
      stopTimer();
      sendDataToPopup('end');
      chrome.browserAction.setIcon({ path: `icons/icon-inactive-32.png` });
      return;
    }
    if (!isBreak && currentAllTime !== 0) {
      if (amountOfRepeats % longBreakAfter === 0) {
        currentTimerTime = longBreak;
      } else {
        currentTimerTime = shortBreak;
      }
      isBreak = true;
      
      // Show notifications if appropriate setting is true
      if(showNotifications) callNotification("It's time to have some rest!");
    } else {
      currentTimerTime = workTime
      amountOfRepeats++;
      isBreak = false;
      
      // Show notifications if appropriate setting is true
      if(showNotifications) callNotification("It's time back to work!");
    }
    chrome.browserAction.setIcon({ path: `icons/icon-${isBreak ? 'break-32' : 'work-32'}.png` });
    sendDataToPopup();
    
    if (timer === null) {
      timer = setInterval(update, 1000);
      // sendDataToPopup();
    }
  } else {
    currentTime++;
    sendDataToPopup();
  }
  currentAllTime++;
  
}

function sendDataToPopup(cmd = '') {
  if (cmd === 'end') {
    chrome.runtime.sendMessage({
      answer: 'endTimer',
      data: getTimerData()
    });
  } else if (cmd === 'discard') {
    chrome.runtime.sendMessage({
      answer: 'discardTimer',
      data: getTimerData()
    });
  } else {
    chrome.runtime.sendMessage({
      answer: 'getTimerState',
      data: getTimerData()
    });
  }
}

chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (msg) {

    if (msg.cmd === "getTimer") {
      port.postMessage({
        answer: "getTimer",
        data: getTimerData()
      });
    } else if (msg.cmd === "startTimer") {
      startTimer();
      port.postMessage({
        answer: "startTimer",
        data: getTimerData() 
      });
    } else if (msg.cmd === "pauseTimer") {
      pauseTimer();
      port.postMessage({
        answer: "pauseTimer",
        data: getTimerData()
      });
    } else if (msg.cmd === "stopTimer") {
      stopTimer();
      port.postMessage({
        answer: "stopTimer",
        data: getTimerData() 
      });
    }

  });
});

function getTimerData(){
  return {
      currentTimerTime: currentTimerTime,
      currentTime: currentTime,
      allTime: allTime,
      currentAllTime: currentAllTime,
      isBreak: isBreak,
      isPause: isPause,
      amountOfRepeats: amountOfRepeats,
      workRepeats: workRepeats,
      isTimer: timer !== null,
    };
}
//////////////////////////////////////////////////////

chrome.runtime.onInstalled.addListener(function () {
  // add an action here
  //setInterval(timedpopup, 10000);
});

var counter = 0;

function callNotification(msg) {
  chrome.notifications.create('report' + counter, {
    type: "basic",
    title: "BreakToGo",
    message: msg,
    iconUrl: `images/${isBreak ? 'break' : 'work'}-notification-64.png`
  }, function () { });
  counter++;
}