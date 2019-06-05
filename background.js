var workTime = 0,
  workRepeats = 0,
  shortBreak = 0,
  longBreak = 0,
  longBreakAfter = 0,
  currentTime = 0,
  currentTimerTime = 0,
  amountOfLongBreaks = 0,
  currentAllTime = 1,
  allTime = 0,
  amountOfRepeats = 0,
  showNotifications,
  isBreak = false,
  isPause = true,
  timer = null

function restoreSettings() {
  // Use default values
  chrome.storage.sync.get({
    workTime: 60,
    workRepeats: 4,
    shortBreak: 5,
    longBreak: 10,
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

//------------BLOCK PAGES SECTION----------------------------------------------------
const depricatedSites = ['facebook.com', 'reddit.com', 'habr.com']

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  toBlockPage(tab);
});

chrome.tabs.onCreated.addListener(function (tab) {
  toBlockPage(tab);
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    toBlockPage(tab);
  })
});

function toBlockPage(tab) {

  let result = depricatedSites.some((el) => {
    let re = new RegExp(el, "g");
    return re.test(tab.url);
  });

  if (result)
    chrome.tabs.sendMessage(tab.id, { "message": "block_page", "isBreak": isBreak, "isTimer": timer !== null });
}

function checkActiveTabToBlock() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var activeTab = tabs[0];
    toBlockPage(activeTab);
  });
}
//-------------------------------------------------------

function calcAmountOfLongBreaks() {
  let amount = 0
  if (workRepeats <= longBreakAfter) {
    return amount;
  } else {
    if (workRepeats % longBreakAfter === 0) {
      amount = workRepeats / longBreakAfter - 1;
    } else {
      amount = Math.floor(workRepeats / longBreakAfter);
    }
  }
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
}

function discardTimer() {
  clearInterval(timer);
  timer = null;
  isPause = true;
  isBreak = false;
  currentTime = 0;
  currentAllTime = 1;
  currentTimerTime = 0;
  amountOfRepeats = 0;
  amountOfLongBreaks = 0;
  allTime = 0;
  chrome.browserAction.setIcon({ path: `icons/icon-inactive-32.png` });
}

function update() {
  if (currentTime >= currentTimerTime) {
    currentTime = 1;
    if (amountOfRepeats >= workRepeats) {
      discardTimer();
      sendDataToPopup('end');
      chrome.browserAction.setIcon({ path: `icons/icon-inactive-32.png` });
      // Block page if necessary
      checkActiveTabToBlock();
      return;
    }
    if (!isBreak && currentAllTime !== 1) {
      if (amountOfRepeats % longBreakAfter === 0) {
        currentTimerTime = longBreak;
      } else {
        currentTimerTime = shortBreak;
      }
      isBreak = true;

      // Show notifications if appropriate setting is true
      if (showNotifications) callNotification("It's time to have some rest!");
    } else {
      currentTimerTime = workTime
      amountOfRepeats++;
      isBreak = false;

      // Show notifications if appropriate setting is true
      if (showNotifications) callNotification("It's time back to work!");
    }
    chrome.browserAction.setIcon({ path: `icons/icon-${isBreak ? 'break-32' : 'work-32'}.png` });
    sendDataToPopup();

    if (timer === null) {
      timer = setInterval(update, 1000);
      // sendDataToPopup();
    }
    // Block page if necessary
    checkActiveTabToBlock();
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
    } else if (msg.cmd === "discardTimer") {
      discardTimer();
      port.postMessage({
        answer: "discardTimer",
        data: getTimerData()
      });
    }

  });
});

function getTimerData() {
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

function clearNotificaion() {
  chrome.notifications.clear('reportBreakToGo')
}

function callNotification(msg) {
  chrome.notifications.create('reportBreakToGo', {
    type: "basic",
    title: "BreakToGo",
    message: msg,
    iconUrl: `images/${isBreak ? 'break' : 'work'}-notification-64.png`
  }, function (nID) {
    setTimeout(clearNotificaion, 5000);
  });
}