// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const { Menu, ipcMain } = require('electron');
const { clipboard } = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let safeExit = false;

function genMenu() {
  var appMenuTemplate = [
    {
      label: '文件',
      submenu: [
        {
          label: "打开",
          click() {
            mainWindow.webContents.send('action', 'open');
          },
          accelerator: 'CmdOrCtrl+O'
        },
        {
          label: "保存",
          click() {
            mainWindow.webContents.send('action', 'save');
          },
          accelerator: 'CmdOrCtrl+S'
        },
        {
          type: 'separator'
        },
        {
          label: "退出",
          role: 'quit'
        }
      ]
    },
    {
      label: '查看',
      submenu: [
        {
          label: "搜索",
          click() {
            mainWindow.webContents.findInPage(clipboard.readText());
          },
          accelerator: 'CmdOrCtrl+F'
        }
      ]
    },
    {
      label: '帮助',
      role: 'help',
      submenu: [
        {
          label: '主页',
          click() { require('electron').shell.openExternal('http://www.baidu.com'); }
        }
      ]
    }
  ];
  const appMenu = Menu.buildFromTemplate(appMenuTemplate);
  Menu.setApplicationMenu(appMenu);
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600 })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  mainWindow.on('close', (e) => {
    if (!safeExit) {
      e.preventDefault();
      mainWindow.webContents.send('action', 'exiting');
    }
  });

  mainWindow.webContents.on('found-in-page', (event, result) => {
    if (result.finalUpdate) {
      //mainWindow.webContents.stopFindInPage('keepSelection');
    }
  });

  genMenu();
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

//监听与渲染进程的通信
ipcMain.on('reqaction', (event, arg) => {
  switch (arg) {
    case 'exit':
      safeExit = true;
      app.quit();//退出程序
      break;
  }
});
