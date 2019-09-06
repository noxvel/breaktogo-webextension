var globalBlockList = [];

$(document).ready(() => {

  restoreSettings();

  $("#settingsForm").submit((event) => {
    event.preventDefault();
    saveSettings();
  });

  $("#newSiteToBlockBtn").on('click', (event) => {
    addNewSiteToBlockList();
    event.preventDefault();
    event.stopPropagation();
  })

  $("#newSiteToBlock").keypress((event) => {
    let keycode = (event.keyCode ? event.keyCode : event.which);
    if (keycode == '13') {
      addNewSiteToBlockList();
      event.stopPropagation();
      event.preventDefault();
    }
  });

  $(".calc-end-time").change(() => {
    let info =
    {
      workTime: $('#workTime').val(),
      workRepeats: $('#workRepeats').val(),
      shortBreak: $('#shortBreak').val(),
      longBreak: $('#longBreak').val(),
      longBreakAfter: $('#longBreakAfter').val(),
      showNotifications: $('#showNotifications').is(':checked'),
      blockSites: $('#blockSites').is(':checked'),
      autoStartTime: $('#autoStartTime').val()
    };
    $('#endAutoStartTime').text(calcAllTime(info));
  });

});

function addNewSiteToBlockList() {
  let newSite = $('#newSiteToBlock');
  if (newSite.val() !== '') {
    globalBlockList.push(newSite.val());
    newSite.val('');
    updateBlockListView();
  }
}

// Saves settings to chrome.storage
function saveSettings() {
  let workTime = $('#workTime').val();
  let workRepeats = $('#workRepeats').val();
  let shortBreak = $('#shortBreak').val();
  let longBreak = $('#longBreak').val();
  let longBreakAfter = $('#longBreakAfter').val();
  let showNotifications = $('#showNotifications').is(':checked');
  let blockSites = $('#blockSites').is(':checked');
  let autoStartParam = $('#autoStartParam').is(':checked');
  let autoStartTime = $('#autoStartTime').val();
  // let blockListSites = $('#blockListSites')
  chrome.storage.sync.set({
    workTime: workTime,
    workRepeats: workRepeats,
    shortBreak: shortBreak,
    longBreak: longBreak,
    longBreakAfter: longBreakAfter,
    showNotifications: showNotifications,
    blockSites: blockSites,
    blockListSites: globalBlockList,
    autoStartTime: autoStartTime,
    autoStartParam: autoStartParam
  }, () => {
    chrome.runtime.sendMessage({
      msg: 'refresh_settings'
    });
    chrome.tabs.getCurrent((tab) => {
      chrome.tabs.remove(tab.id, () => { });
    });
  });
}

// Restores settings using the preferences stored in chrome.storage.
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
    blockListSites: ['facebook.com', 'reddit.com', 'twitter.com'],
    autoStartTime: '09:00',
    autoStartParam: false
  }, (items) => {
    $('#workTime').val(items.workTime);
    $('#workRepeats').val(items.workRepeats);
    $('#shortBreak').val(items.shortBreak);
    $('#longBreak').val(items.longBreak);
    $('#longBreakAfter').val(items.longBreakAfter);
    $('#showNotifications').prop('checked', items.showNotifications);
    $('#blockSites').prop('checked', items.blockSites);
    $('#autoStartParam').prop('checked', items.autoStartParam);
    $('#autoStartTime').val(items.autoStartTime);

    globalBlockList = items.blockListSites;
    updateBlockListView();

    $('#endAutoStartTime').text(calcAllTime(items));
  });
}

function timerView(strings, hoursExp, minutesExp) {

  if (hoursExp.toString().length < 2)
    hoursExp = '0' + hoursExp;
  if (minutesExp.toString().length < 2)
    minutesExp = '0' + minutesExp;

  return `${hoursExp}:${minutesExp}`;
}

function calcAllTime(i) {
  let amountOfLongBreaks = 0;
  if (i.workRepeats <= i.longBreakAfter) {
  } else {
    if (i.workRepeats % i.longBreakAfter === 0) {
      amountOfLongBreaks = i.workRepeats / i.longBreakAfter - 1;
    } else {
      amountOfLongBreaks = Math.floor(i.workRepeats / i.longBreakAfter);
    }
  }

  let allTime = i.workTime * i.workRepeats + amountOfLongBreaks * i.longBreak +
    i.shortBreak * ((i.workRepeats - amountOfLongBreaks) - 1);
  let currentStartTime = (parseInt(i.autoStartTime.substr(0, 2)) * 60) + parseInt(i.autoStartTime.substr(3, 2));
  allTime += currentStartTime;

  return timerView`${Math.floor((allTime / 60) % 24)}:${allTime % 60}`;
}

function updateBlockListView() {

  let bListEl = $('#blockListSites');
  bListEl.empty();
  globalBlockList.forEach((el) => {
    let li = $('<li/>')
      .text(el)
      .appendTo(bListEl);
    $('<a/>')
      .addClass('delete-btn')
      .attr('href', '#')
      // .text('✖')
      .on('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        deleteSelectedSiteFromBlockList(event.currentTarget);
      })
      .appendTo(li);
  });
}

function deleteSelectedSiteFromBlockList(delBtn) {
  globalBlockList = globalBlockList.filter(n => { return n !== $(delBtn).parent().text(); });
  updateBlockListView()
}