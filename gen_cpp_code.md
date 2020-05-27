---
description: 仅供程序查看
---

# 生成cpp代码

### 对数据文件命名的额外要求

如果不遵循命名规范，将无法生成有效的cpp代码。

示例请看 [fruits.xml](https://github.com/uhziel/gxeditor/blob/master/example/data/fruits.xml)

* 文件名必须是根节点的名字
* 节点名、属性名必须符合下划线命名法\(全小写，单词间用\_连接，比如 red\_apple\)

### 生成代码

{% hint style="warning" %}
确保数据文件对应的模版文件已准备就绪。最主要的是，元素的"multi"字段、属性的"type"字段要正确。
{% endhint %}

右键菜单-&gt;生成cpp代码，可生成数据对应的cpp读取代码。

### 应用到你的项目里

这里以示例项目 [example](https://github.com/uhziel/gxeditor/tree/master/example) 中的 proj\_read\_config 做示例说明。它使用的xml库是 [tinyxml](http://www.grinninglizard.com/tinyxml/)。

1. 放入桥接文件 gx\_utils.h/.cpp 到 tinyxml\_template
2. 放入生成的cpp代码到 tinyxml\_template
3. 将 tinyxml\_template 的所有文件加入到项目
4. 编译。如果编译出错，可能需要你解决下 \#include 的路径包含问题。
5. main.cpp 文件演示了从文件读取\(Config::Load\(\)\)和从字符串读取Config::Parse\(\)\)数据文件两种方式。



