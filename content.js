chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.message === "block_page") {
      if (request.isBreak || !request.isTimer){
        const modal = document.querySelector('#break-to-go-modal-container')
        if (modal) {
          modal.remove();
          $('body').css('overflow', 'auto');
        }
      }else{
        if(!document.querySelector('#break-to-go-modal-container')){
          $('body').append(`<div id="break-to-go-modal-container">
                                <div id="break-to-go-modal-child">
                                  <h2>Break To Go</h2>
                                  <h3>Sorry, but you need to wait for a break to view this site.</h3>
                                  <p>You can disable this feature or change the list of sites to block in the settings.</p>
                                </div>
                              </div>`)
                            }
          $('body').css('overflow', 'hidden');
      }
    }
  }
);
