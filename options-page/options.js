

$(document).ready(function () {

  restoreSettings();

  $("#settingsForm").submit((event) => {
    event.preventDefault();
    saveSettings();
  });
});

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