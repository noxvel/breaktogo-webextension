chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === "block_page") {
      if (request.isBreak || !request.isTimer){
        $.modal.close();
      }else{
        if (!$("#break-to-go-block-modal").length){
          $('body').append(`<div id="break-to-go-block-modal" class="modal">
                              <h2 style="color: #5D8EE4;">Break To Go</h2>
                              <h3>Sorry, but you need to wait for a break to view this site.</h3>
                              <p>You can disable this feature or change the list of sites to block in the settings.</p>
                              </div>`)
                            }
                            // <a href="#" rel="modal:close">Close</a>
        $("#break-to-go-block-modal").modal({
          escapeClose: false,
          clickClose: false,
          showClose: false,
          blockerClass: 'jquery-modal special-blocker-break-to-go',
        });
      }
    }
  }
);