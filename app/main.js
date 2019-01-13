// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const { Menu, ipcMain, shell, dialog } = require('electron');
const {autoUpdater} = require("electron-updater");
const package = require("../package.json");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let searchWindow = null;
let safeExit = false;

function genMenu() {
  var appMenuTemplate = [
    {
      label: '文件',
      submenu: [
        {
          label: "打开项目",
          click() {
            mainWindow.webContents.send('action', 'openProject');
          }
        },
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
      label: '编辑',
      submenu: [
        {
          label: "撤销",
          click() {
            mainWindow.webContents.send('action', 'undo');
          },
          accelerator: 'CmdOrCtrl+Z'
        },
        {
          label: "重做",
          click() {
            mainWindow.webContents.send('action', 'redo');
          },
          accelerator: 'CmdOrCtrl+Shift+Z'
        },
        { type: 'separator' },
        { label: "剪切", role: 'cut' },
        { label: "复制", role: 'copy' },
        { label: "粘贴", role: 'paste' },
        { type: 'separator' },
        {
          label: "搜索",
          click() {
            if (searchWindow === null) {
              newSearchWindow(mainWindow);
            }
          },
          accelerator: 'CmdOrCtrl+F'
        },
        { type: 'separator' },
        { label: "全选", role: 'selectall' }
      ]
    },
    {
      label: '查看',
      submenu: [
        {
          label: "易读",
          type: "radio",
          click() {
            mainWindow.webContents.send('action', 'setViewModeEasy');
          }
        },
        {
          label: "原生",
          type: "radio",
          click() {
            mainWindow.webContents.send('action', 'setViewModeRaw');
          }
        }
      ]
    },
    {
      label: '工具',
      submenu: [
        {
          label: "生成cpp代码",
          click() {
            mainWindow.webContents.send('action', 'genCppCode');
          }
        }
      ]
    },
    {
      label: "帮助",
      role: "help",
      submenu: [
        {
          label: "主页",
          click() { shell.openExternal(package.homepage); }
        },
        {
          label: "关于",
          click() {
            dialog.showMessageBox(mainWindow, {
              buttons: ["确认"],
              title: "关于",
              message: `版本 v${package.version}`,
            });
          }
        }
      ]
    }
  ];
  if (process.env.GXEDITOR_DEBUG) {
    appMenuTemplate[1].submenu.push({ role: 'toggleDevTools' });
  }
  const appMenu = Menu.buildFromTemplate(appMenuTemplate);
  Menu.setApplicationMenu(appMenu);
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 800, height: 600 })

  // and load the index.html of the app.
  mainWindow.loadFile('app/index.html')

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

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
    searchWindow.send('notifyFoundInPage', `(${result.activeMatchOrdinal},${result.matches})`);
  });

  genMenu();
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// electron-builder auto-update
app.on('ready', function()  {
  autoUpdater.checkForUpdatesAndNotify();
});

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
ipcMain.on('reqaction', (event, arg, arg1, arg2) => {
  switch (arg) {
    case 'search':
      mainWindow.webContents.findInPage(arg1, {forward: arg2});
      break;
    case 'stopSearch':
      searchWindow.close();
      break;
    case 'exit':
      safeExit = true;
      app.quit();//退出程序
      break;
    case 'showItemInFolder':
      shell.showItemInFolder(arg1);
      break;
  }
});

function newSearchWindow(parentWindow) {
  searchWindow = new BrowserWindow({parent: parentWindow});
  let {x, y, width} = parentWindow.getContentBounds();
  searchWindow.setBounds({ x: x+width-300, y: y, width: 300, height: 100 });
  searchWindow.webContents.loadFile('app/search_text_box.html');
  //searchWindow.webContents.openDevTools(); 
  searchWindow.on('closed', () => {
    mainWindow.webContents.stopFindInPage('clearSelection');
    searchWindow = null;
  });
}
