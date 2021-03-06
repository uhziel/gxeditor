---
description: 了解软件的基本使用方法。
---

# 快速开始

### 基本编辑功能

1. 打开示例项目，位置在gxeditor安装目录下的example。操作：菜单-&gt;文件-&gt;打开项目...
2. 打开数据文件 demo.xml。操作：菜单-&gt;文件-&gt;打开...。
3. 鼠标移动到各数据上，可以看到相应的描述。
4. 编辑数据
5. 保存数据

### 生成默认模版

{% hint style="info" %}
demo\_no\_tmpl.xml 内容和 demo.xml 一致
{% endhint %}

1. 打开示例项目数据文件 demo\_no\_tmpl.xml。你会发现这时进入的是文本编辑模式，和之前打开demo.xml时不一样。这是因为它还没有对应的模版。
2. 生成默认模版。操作：鼠标右键-&gt;生成默认模版。这时，会弹出模版所在文件夹，并重载数据文件进入渲染模式。

### 修改模版

1. 将刚生成的默认模版文件 demo\_no\_tmpl.json 用你喜欢的文本编辑器打开。推荐使用 Visual Code，因为它有完善的检错功能。
2. 将"demo"的"desc"后面的值，从""改为"这是一个演示用的配置文件"。
3. 重载文件，让修改模版内容生效。操作：菜单-&gt;编辑-&gt;重载文件。
4. 鼠标移动到gxeditor上的"demo"上，稍等片刻，就可以看到刚刚输入的内容。
5. 你可以参照已有的 demo.json 文件，编辑 demo\_no\_tmpl.json 来进行各种试验。

### 打开大数据文件

对于大数据文件来说，进入渲染模式后，会非常卡。

为了优化这个问题，就算它有模版文件，也打开的是文本编辑模式。用户可通过选择自己关心的内容进行渲染来进行编辑。操作：鼠标选择内容-&gt;鼠标右键-&gt;渲染。

### 拖动数据来改变顺序

如果数据前面有可拖动标识，鼠标移动到标识上会变成拖动样式。这时候可以拖动数据来调整各数据间的顺序。

如果数据离目标位置很远，可以选择先拖放到临时区，滚动页面到目标位置，再从临时区放回。临时区的打开：页面的最右侧，有条浅黄色的竖条，点击即打开临时区。

### 在各数据文件间快速切换

有时可能需要同时编辑多个项目或文件。

这时，可以通过"菜单-&gt;文件-&gt;打开最近..."来迅速的切换。或则，"右键菜单-&gt;打开所在文件夹"，再把同文件夹内其他需要编辑的文件拖入编辑器，以快速打开。

### 打开数据文件所在wiki

"右键菜单-&gt;打开wiki"。

wiki内可以记录：游戏内功能入口在哪，历史出现过哪些问题，需要注意哪些事项。这样，当新用户在编辑数据文件时，能从wiki上得到一些有意义的帮助。

