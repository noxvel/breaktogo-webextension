var globalBlockList = [];

$(document).ready(function () {

  restoreSettings();

  $("#settingsForm").submit((event) => {
    event.preventDefault();
    saveSettings();
  });
  $("#newSiteToBlockBtn").on('click', (event) => {
    addNewSiteToBlockList();
    event.preventDefault();
    event.stopPropagation();
  });
});

function addNewSiteToBlockList() {
  let newSite = $('#newSiteToBlock');
  if(newSite.val() !== ''){
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
  // let blockListSites = $('#blockListSites')

  chrome.storage.sync.set({
    workTime: workTime,
    workRepeats: workRepeats,
    shortBreak: shortBreak,
    longBreak: longBreak,
    longBreakAfter: longBreakAfter,
    showNotifications: showNotifications,
    blockSites: blockSites,
    blockListSites: globalBlockList
  }, function () {
    chrome.tabs.getCurrent(function (tab) {
      chrome.tabs.remove(tab.id, function () { });
    });
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
    workTime: 0.3,
    workRepeats: 3,
    shortBreak: 0.1,
    longBreak: 0.2,
    longBreakAfter: 2,
    showNotifications: true,
    blockSites: false,
    blockListSites: ['facebook.com', 'reddit.com', 'twitter.com']
  }, function (items) {
    $('#workTime').val(items.workTime);
    $('#workRepeats').val(items.workRepeats);
    $('#shortBreak').val(items.shortBreak);
    $('#longBreak').val(items.longBreak);
    $('#longBreakAfter').val(items.longBreakAfter);
    $('#showNotifications').prop('checked', items.showNotifications);
    $('#blockSites').prop('checked', items.blockSites);

    globalBlockList = items.blockListSites;
    updateBlockListView();
  });
}

function updateBlockListView() {

  let bListEl = $('#blockListSites');
  bListEl.empty();
  globalBlockList.forEach((el) => {
    let li = $('<li/>')
      .text(el)
      .appendTo(bListEl);
    let aaa = $('<a/>')
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

function deleteSelectedSiteFromBlockList(delBtn){
  globalBlockList = globalBlockList.filter(n => { return n !== $(delBtn).parent().text(); }); 
  updateBlockListView()
}