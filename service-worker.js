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
  blockSites,
  autoStartParam,
  blockListSites = [],
  isBreak = false,
  isPause = true,
  timer = null

function restoreSettings() {
  // Use default values
  chrome.storage.sync.get({
    workTime: 60,
    workRepeats: 8,
    shortBreak: 5,
    longBreak: 15,
    longBreakAfter: 2,
    showNotifications: true,
    blockSites: false,
    autoStartParam: false,
    blockListSites: ['facebook.com', 'reddit.com', 'twitter.com']
  }, (items) => {
    workTime = items.workTime * 60;
    workRepeats = items.workRepeats;
    shortBreak = items.shortBreak * 60;
    longBreak = items.longBreak * 60;
    longBreakAfter = items.longBreakAfter;
    showNotifications = items.showNotifications;
    blockSites = items.blockSites;
    blockListSites = items.blockListSites;
    autoStartParam = items.autoStartParam;
    amountOfLongBreaks = calcAmountOfLongBreaks();
    allTime = calcAllTime();
  });
}

const refreshSettings = () => {
  chrome.storage.sync.get({
    showNotifications: true,
    blockSites: false,
    autoStartParam: false,
    blockListSites: ['facebook.com', 'reddit.com', 'twitter.com']
  }, (items) => {
    showNotifications = items.showNotifications;
    blockSites = items.blockSites;
    blockListSites = items.blockListSites;
    autoStartParam = items.autoStartParam;
  });
}

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

//------------BLOCK PAGES AND AUTOSTART SECTION----------------------------------------------------

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  toBlockPage(tab, blockSites);
});

chrome.tabs.onCreated.addListener((tab) => {
  toBlockPage(tab, blockSites);
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    toBlockPage(tab, blockSites);
  })
});

chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.sync.get({
    autoStartTime: '09:00',
    autoStartParam: false
  }, (items) => {
    if (timer === null && items.autoStartParam) {
      let autoStartTime = items.autoStartTime;
      let date = new Date(); // Create a Date object to find out what time it is
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        if (date.getHours() === parseInt(autoStartTime.substr(0, 2)) && date.getMinutes() === parseInt(autoStartTime.substr(3, 2))) { // Check the time
          startTimer();
        }
      }
    }
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("autoStartCheck", { periodInMinutes: 1.0 })
});

chrome.runtime.onStartup.addListener(() => {
  refreshSettings();
  chrome.action.setIcon({ path: `icons/icon-inactive-32.png` });
});

function toBlockPage(tab, toBlock) {
  if (toBlock) {
    let result = blockListSites.some((el) => {
      let re = new RegExp(el, "g");
      return re.test(tab.url);
    });

    if (result)
      chrome.tabs.sendMessage(tab.id, { "message": "block_page", "isBreak": isBreak, "isTimer": timer !== null });
  }
}

function checkActiveTabToBlock(toBlock) {
  if (toBlock) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      var activeTab = tabs[0];
      toBlockPage(activeTab, toBlock);
    });
  }
}
//-------------------------------------------------------


function startTimer() {

  if (allTime === 0)
    chrome.storage.sync.get({
        currentAllTime: 1,
        currentTime: 0,
        currentTimerTime: 0,
        amountOfRepeats: 0
      }, (items) => {
        currentAllTime = items.currentAllTime;
        currentTime = items.currentTime;
        currentTimerTime = items.currentTimerTime;
        amountOfRepeats = items.amountOfRepeats;
    });
    restoreSettings();

    isPause = false;
    timer = setInterval(update, 1000);
  }

function pauseTimer() {
  chrome.storage.sync.set({
    currentAllTime: currentAllTime,
    currentTime: currentTime,
    currentTimerTime: currentTimerTime,
    amountOfRepeats: amountOfRepeats
  });
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
  checkActiveTabToBlock(true);
  chrome.action.setIcon({ path: `icons/icon-inactive-32.png` });

  chrome.storage.sync.set({
    currentAllTime: 1,
    currentTime: 0,
    currentTimerTime: 0,
    amountOfRepeats: 0
  });
}

function update() {
  if (currentTime >= currentTimerTime) {
    currentTime = 1;
    if (amountOfRepeats >= workRepeats) {
      discardTimer();
      sendDataToPopup('end');
      chrome.action.setIcon({ path: `icons/icon-inactive-32.png` });
      // Block page if necessary
      checkActiveTabToBlock(blockSites);
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
      if (showNotifications && amountOfRepeats !== 1) callNotification("It's time back to work!");
    }
    chrome.action.setIcon({ path: `icons/icon-${isBreak ? 'break-32' : 'work-32'}.png` });
    sendDataToPopup();

    if (timer === null) {
      timer = setInterval(update, 1000);
      // sendDataToPopup();
    }
    // Block page if necessary
    checkActiveTabToBlock(blockSites);
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

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.msg === "refresh_settings") {
      refreshSettings();
    }else if(request.msg === "getTimer"){
      sendResponse({data: getTimerData()});
    }
  }
);

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {

    if (msg.cmd === "startTimer") {
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
// Notification section

function clearNotificaion() {
  chrome.notifications.clear('reportBreakToGo')
}

function callNotification(msg) {
  chrome.notifications.create('reportBreakToGo', {
    type: "basic",
    title: "BreakToGo",
    message: msg,
    iconUrl: `images/${isBreak ? 'break' : 'work'}-notification-64.png`
  }, (nID) => {
    setTimeout(clearNotificaion, 5000);
  });
}