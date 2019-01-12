# gxeditor

#### 项目介绍
gxeditor(Game Xml Editor)，游戏Xml编辑器。旨在方便的编辑、校验游戏xml文件。
也可以生成cpp读取模版的代码。

#### 安装和使用

```bash
npm install
npm start
```

#### 体验功能

* 找到程序下 example 文件夹，其为示例项目。
* 菜单 文件->打开项目 选择 example
* 菜单 文件->打开 选择任意xml文件
* 自由的查看和编辑
* 菜单 工具->生成cpp代码，可生成xml对应的cpp读取代码
* example 目录介绍：
  * gxproject.json 项目配置。
  * data 游戏数据文件目录。可通过gxproject.json 更改位置。
  * template 模版目录。模版描述了游戏数据文件的样式。
  * cppcode 被生成的cpp代码放这里。
  * proj_read_config cpp读取配置的示例工程。现支持 vs2008、clang+Makefile。

#### 打包和发布

```bash
npm run pack
npm run dist
```
