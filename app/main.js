// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');
const { Menu, MenuItem, ipcMain, shell, dialog } = require('electron');
const {autoUpdater} = require("electron-updater");
const logger = require("electron-log");
const package = require("../package.json");
const gxStrings = require("./utils/gx_strings");
const gxAppConfig = require("./utils/gx_app_config");

autoUpdater.logger = logger;
autoUpdater.logger.transports.file.level = 'info';

global.sharedObject = {
  appConfig : gxAppConfig,
  isXonomyPopup: false
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;
let searchWindow = null;
let safeExit = false;

function refreshAppMenu() {
  var appMenuTemplate = [
    {
      label: gxStrings.appMenuFile,
      id: "appMenuFile",
      submenu: [
        {
          label: gxStrings.appMenuOpenProject,
          click() {
            mainWindow.webContents.send('action', 'openProject');
          }
        },
        {
          label: gxStrings.appMenuOpenFile,
          id: "appMenuOpenFile",
          click() {
            mainWindow.webContents.send('action', 'open');
          },
          accelerator: 'CmdOrCtrl+O'
        },
        {
          label: gxStrings.appMenuOpenRecent,
          id: "appMenuOpenRecent",
          submenu: []
        },
        {
          label: gxStrings.appMenuSaveFile,
          click() {
            mainWindow.webContents.send('action', 'save');
          },
          accelerator: 'CmdOrCtrl+S'
        },
        {
          type: 'separator'
        },
        {
          label: gxStrings.appMenuQuit,
          click() {
            const focusedWindows = BrowserWindow.getFocusedWindow();
            focusedWindows.close();
          },
          accelerator: 'CmdOrCtrl+Q'
        }
      ]
    },
    {
      label: gxStrings.appMenuEdit,
      id: "appMenuEdit",
      submenu: [
        {
          label: gxStrings.appMenuUndo,
          click() {
            const focusedWindows = BrowserWindow.getFocusedWindow();
            focusedWindows.webContents.send('action', 'undo');
          },
          accelerator: 'CmdOrCtrl+Z'
        },
        {
          label: gxStrings.appMenuRedo,
          click() {
            const focusedWindows = BrowserWindow.getFocusedWindow();
            focusedWindows.webContents.send('action', 'redo');
          },
          accelerator: 'CmdOrCtrl+Shift+Z'
        },
        { type: 'separator' },
        { label: gxStrings.appMenuCut, role: 'cut' },
        { label: gxStrings.appMenuCopy, role: 'copy' },
        { label: gxStrings.appMenuPaste, role: 'paste' },
        { type: 'separator' },
        {
          label: gxStrings.appMenuFind,
          id: "appMenuFind",
          click() {
            if (searchWindow === null) {
              newSearchWindow(mainWindow);
            }
          },
          accelerator: "CmdOrCtrl+F"
        },
        { type: "separator" },
        { label: gxStrings.appMenuSelectAll, role: "selectall" },
        {
          label: gxStrings.appMenuReload,
          accelerator: 'CmdOrCtrl+Shift+R',
          click() {
            const focusedWindows = BrowserWindow.getFocusedWindow();
            focusedWindows.webContents.send("action", "reload");            
          }
        }
      ]
    },
    {
      label: gxStrings.appMenuView,
      submenu: [
        {
          label: gxStrings.appMenuModeEasy,
          id: "appMenuModeEasy",
          type: "radio",
          click() {
            const focusedWindows = BrowserWindow.getFocusedWindow();
            focusedWindows.webContents.send("action", "setViewMode", "easy");
          }
        },
        {
          label: gxStrings.appMenuModeRaw,
          id: "appMenuModeRaw",
          type: "radio",
          click() {
            const focusedWindows = BrowserWindow.getFocusedWindow();
            focusedWindows.webContents.send("action", "setViewMode", "raw");
          }
        }
      ]
    },
    {
      label: gxStrings.appMenuHelp,
      role: "help",
      submenu: [
        {
          label: gxStrings.appMenuHomepage,
          click() { shell.openExternal(package.homepage); }
        },
        {
          label: gxStrings.appMenuDocument,
          click() { shell.openExternal(package.document); }
        },
        {
          label: gxStrings.appMenuAbout,
          click() {
            dialog.showMessageBox(mainWindow, {
              buttons: [gxStrings.ok],
              title: gxStrings.appMenuAbout,
              message: gxStrings.appMenuAboutMessage + package.version,
            });
          }
        }
      ]
    }
  ];

  const appMenu = Menu.buildFromTemplate(appMenuTemplate);
  const recent = gxAppConfig.getRecent();
  const emptyProject = (recent.projects.length === 0);

  //只有已打开项目，才允许打开文件
  const openMenuItem = appMenu.getMenuItemById("appMenuOpenFile");
  if (emptyProject) {
    openMenuItem.enabled = false;
  } else {
    openMenuItem.enabled = true;
  }

  //如果现在渲染窗口打开,只显示部分数据
  const fileMenuItem = appMenu.getMenuItemById("appMenuFile");
  const fileMenuEnabled = !global.sharedObject.isXonomyPopup;
  fileMenuItem.submenu.items.forEach((menuItem) => {
    if (menuItem.label !== gxStrings.appMenuQuit) {
      menuItem.enabled = fileMenuEnabled;
    }
  });

  const findMenuItem = appMenu.getMenuItemById("appMenuFind");
  if (global.sharedObject.isXonomyPopup) {
    findMenuItem.enabled = false;
  } else {
    findMenuItem.enabled = true;
  }

  //开发环境时，加上开关 DevTools 菜单选项
  if (process.env.GXEDITOR_DEBUG) {
    const editMenuItem = appMenu.getMenuItemById("appMenuEdit");
    editMenuItem.submenu.append(new MenuItem({ role: 'toggleDevTools' }));
  }

  //添加下默认的"打开最近"菜单
  const openRecentMenuItem = appMenu.getMenuItemById("appMenuOpenRecent");
  if (emptyProject) {
    openRecentMenuItem.submenu.append(new MenuItem({
      label: gxStrings.appMenuEmptyProject,
      enabled: false
    }));
  } else {
    for (let i = 0; i < recent.projects.length; i++) {
      const path = recent.projects[i].path;
      openRecentMenuItem.submenu.append(new MenuItem({
        label: path,
        click() {
          mainWindow.webContents.send("action", "openProject", path);
        }
      })); 
    }
  }
  openRecentMenuItem.submenu.append(new MenuItem({ type: 'separator' }));
  const emptyFile = emptyProject || (recent.projects[0].files.length === 0);
  if (emptyFile) {
    openRecentMenuItem.submenu.append(new MenuItem({
      label: gxStrings.appMenuEmptyFile,
      enabled: false
    }));
  } else {
    const curProject = recent.projects[0];
    for (let i = 0; i < curProject.files.length; i++) {
      const path = curProject.files[i];
      openRecentMenuItem.submenu.append(new MenuItem({
        label: path,
        click() {
          mainWindow.webContents.send("action", "open", path);
        }
      })); 
    }
  }

  //按照配置勾选当前的显示模式
  const viewMode = gxAppConfig.getViewMode();
  if (viewMode === "raw") {
    const modeRawMenuItem = appMenu.getMenuItemById("appMenuModeRaw");
    modeRawMenuItem.checked = true;
  } else {
    const modeEasyMenuItem = appMenu.getMenuItemById("appMenuModeEasy");
    modeEasyMenuItem.checked = true;
  }

  Menu.setApplicationMenu(appMenu);
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

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

  refreshAppMenu();
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
    case "search":
    {
      mainWindow.webContents.findInPage(arg1, {forward: arg2});
      break;
    }
    case "stopSearch":
    {
      searchWindow.close();
      break;
    }
    case "exit":
    {
      safeExit = true;
      app.quit();//退出程序
      break;
    }
    case "showItemInFolder":
    {
      shell.showItemInFolder(arg1);
      break;
    }
    case "refreshAppMenu":
    {
      refreshAppMenu();
      break;
    }
    case "reloadWindow":
    {
      event.sender.reload();
      break;
    }
  }
});

function newSearchWindow(parentWindow) {
  let {x, y, width} = parentWindow.getContentBounds();
  x = x + width - 230;
  searchWindow = new BrowserWindow({
    x: x,
    y: y,
    width: 230,
    height: 40,
    frame: false,
    parent: parentWindow,
    webPreferences: {
      nodeIntegration: true
    }
  });
  searchWindow.webContents.loadFile('app/search_text_box.html');
  //searchWindow.webContents.openDevTools(); 
  searchWindow.on('closed', () => {
    mainWindow.webContents.stopFindInPage('clearSelection');
    searchWindow = null;
  });
}
