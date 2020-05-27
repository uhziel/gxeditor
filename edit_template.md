---
description: 介绍数据文件和模版文件的概念、写一个简单的模版
---

# 编写模版

## 数据文件与模版文件

数据文件存放用户自己的数据。

模版文件则描述了数据文件的样式。有了这个文件，gxeditor才能比普通的文本编辑器更智能，做到前面的演示效果。

### 看个实际的例子

打开示例项目的 fruits.xml

![](.gitbook/assets/image%20%281%29.png)

引用几个新名词，方便后续讲解

* 属性节点。类似"价格:10"的，叫属性。其中，"价格"是属性名，"10"是属性值。
* 元素节点。每一个横条表示一个元素节点。元素名就是横条最开头的名字。元素节点可以包含零到多组属性节点，可以包含零到多个子元素节点。

### 数据文件 fruits.xml

{% code title="fruits.xml" %}
```markup
<fruits>
    <fruit name="香蕉" price="10" per_sale_time="2018-12-27 00:11:01">
        <energy carbohydrates="22.84" fat="0.33" protein="1.09" />
    </fruit>
    <fruit name="苹果" price="9">
        <energy carbohydrates="0" fat="0" protein="0" />
    </fruit>
</fruits>
```
{% endcode %}

### 模版文件 fruits.json

{% tabs %}
{% tab title="fruits.json" %}
```javascript
{
    "__include__": [
        "${templateDirPath}/__share__/fruit.json"
    ],
    "fruits": {
        "cnName": "水果s",
        "children": [ "fruit" ]
    }
}
```
{% endtab %}

{% tab title="fruit.json" %}
```javascript
{
    "fruit": {
        "cnName": "水果",
        "desc": "即将上架的水果",
        "children": [ "energy" ],
        "multi": true,
        "optional": true,
        "attributes": {
            "name": {
                "cnName": "名字",
                "type": "STRING",
                "default": ""
            }
        }
    }
}
上述内容只截取部分，减少篇幅
```
{% endtab %}

{% tab title="展开后fruits.json" %}
```javascript
{
    "fruit": {
        "cnName": "水果",
        "desc": "即将上架的水果",
        "children": [ "energy" ],
        "multi": true,
        "optional": true,
        "attributes": {
            "name": {
                "cnName": "名字",
                "type": "STRING",
                "default": ""
            }
        }
    }, //上述内容只截取部分，减少篇幅
    "fruits": {
        "cnName": "水果s",
        "children": [ "fruit" ]
    }
}
```
{% endtab %}
{% endtabs %}

### 解释

fruits.xml 对应的模版文件是fruits.json。gxeditor实际是找template目录下同名但后缀不同的模版文件。模版文件里包含了元素规格、属性规格，分别用来描述元素节点、属性节点。

fruits.json 内包含的 "\_\_include\_\_" 部分，其作用是原样把另一个文件 "fruit.json"的内容包含进来。这种包含机制，是为多个不同数据文件共用某元素节点准备的。实际，gxeditor 最终面对的是"展开后的fruits.json"。

首先，我们来看下模版中节点"fruits"的规格。它描述节点其中文名是"水果s"\(取自"cnName"\)，只允许存在"fruit"这个子节点\(取自"children"，实际可包含多种子节点\)。

接着，节点"fruit"的规格里，我们看下字段"attributes"，描述了该节点所能拥有的全部属性。

再接着，我们挑个"fruit"的属性"name"来看下，它的规格里描述了其中文名\("cnName"\)、数据类型\("type"\)、默认值\(""\)。目前支持的数据类型有整数\("INT"\)、字符串\("STRING"\)等。

最后，通过各个节点、属性规格的描述，gxeditor 也就能很好的处理该数据文件了。

想了解元素、属性规格可拥有的所有字段和其解释，可看[元素规格的介绍](yuan-su-de-jie-shao.md)、[属性规格的介绍](shu-xing-de-jie-shao.md)。

## 项目的结构

首先，我们来看下示例项目 example 的目录结构

```text
├── data
│   ├── demo.xml
│   ├── fruits.xml
│   ├── test.xml
│   └── test_no_tmpl.xml
├── gxproject.json
└── template
    ├── __share__
    │   └── fruit.json
    ├── demo.json 
    ├── fruits.json
    └── test.json
```

### data

data文件夹存放数据文件。可通过编辑 gxproject.json 来更改位置。

### template

template文件夹存放模版文件。

### gxproject.json

项目配置文件。只有包含这个文件的文件夹才被视作一个 gxeditor 项目。关于这个配置的详细说明，请看[gxproject.json](gxproject.json.md)。

