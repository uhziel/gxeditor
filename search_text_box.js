const {ipcRenderer} = require('electron');

let searchInput = document.querySelector('.electronSearchText-input');
let searchCount = document.querySelector('.electronSearchText-count');

searchInput.addEventListener('keydown', (event) => {
      // find previous when Shift pressed
      let forward = !event.shiftKey;
      let text = searchInput.value;

      switch(event.code) {
        case 'Enter':
            ipcRenderer.send('reqaction', 'search', text, forward);
            break;
        // exit search also disable search box
        case 'Escape':
            ipcRenderer.send('reqaction', 'stopSearch', text);
            break;
      }
});

ipcRenderer.on('notifyFoundInPage', (event, arg) => {
    searchCount.textContent = arg;
});
