// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const { Menu, ipcMain } = require('electron');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let safeExit = false;

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

  // 创建菜单
  var appMenuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: "新建",
          click() {
            mainWindow.webContents.send('action', 'new');
          },
          accelerator: 'CmdOrCtrl+N'
        },
        {
          label: "打开",
          click() {
            mainWindow.webContents.send('action', 'open'); //点击后向主页渲染进程发送“打开文件”的命令
          },
          accelerator: 'CmdOrCtrl+O' //快捷键：Ctrl+O
        },
        {
          label: "保存",
          click() {
            mainWindow.webContents.send('action', 'save'); //点击后向主页渲染进程发送“保存文件”的命令
          },
          accelerator: 'CmdOrCtrl+S' //快捷键：Ctrl+S
        },
        {
          type: 'separator'
        },
        {
          role: 'quit'
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Home Page',
          click() { require('electron').shell.openExternal('http://www.baidu.com'); }
        }
      ]
    }
  ];
  const appMenu = Menu.buildFromTemplate(appMenuTemplate);
  Menu.setApplicationMenu(appMenu);
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
