---
description: 详细介绍属性规格上各字段含义
---

# 属性规格的介绍

## 属性公有的属性

| 字段 | 描述 | 示例 |
| :--- | :--- | :--- |
| cnName | 该属性的中文名。如果有，在"易读"模式，属性会显示成中文。 | "国籍" |
| desc | 对该属性的描述，如果有，鼠标移动到该属性上，会以tips的形式展示出来。 | "对国籍的描述" |
| type | \[必填\]属性的类型。支持INT\(整数\)、DOUBLE\(浮点\)、STRING\(字符串\)、ENUM\(枚举\)、REF\(引用\)等。 | "STRING" |
| optional | 该属性是否可选。如果可选，该属性默认不会出现，需用户手动创建。 | false |
| default | 该属性的默认值。如果不填，默认值\(整数，"0"；浮点，"0.0"；其他，""\)。 | "1" |

## 各数据类型特有的字段

### INT 整数

[示例链接](https://github.com/uhziel/gxeditor/blob/bb5fee3ef8176369ea151415bbef49ad0efcca60/example/template/demo.json#L49)

| 字段 | 描述 |
| :--- | :--- |
| min | 该属性的最小值。如不填，无该限制。 |
| max | 该属性的最大值。如不填，无该限制。 |

### DOUBLE 浮点数

[示例链接](https://github.com/uhziel/gxeditor/blob/bb5fee3ef8176369ea151415bbef49ad0efcca60/example/template/demo.json#L67)

| 字段 | 描述 |
| :--- | :--- |
| min | 该属性的最小值。如不填，无该限制。 |
| max | 该属性的最大值。如不填，无该限制。 |
| precision | 精度。比如，如果填0.01，则可以出现1.23、1.24，但是不允许1.2111。 |

### ENUM 枚举

[示例链接](https://github.com/uhziel/gxeditor/blob/9ac1602dd89f39239f45c5d183a42fded5129846/example/template/demo.json#L86)

[多级枚举示例链接](https://github.com/uhziel/gxeditor/blob/9ac1602dd89f39239f45c5d183a42fded5129846/example/template/demo.json#L97)

<table>
  <thead>
    <tr>
      <th style="text-align:left">&#x5B57;&#x6BB5;</th>
      <th style="text-align:left">&#x63CF;&#x8FF0;</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:left">enumList</td>
      <td style="text-align:left">
        <p>&#x679A;&#x4E3E;&#x503C;&#x5217;&#x8868;&#x3002;
          <br />&#x793A;&#x4F8B;&#xFF1A;</p>
        <p>&quot;enumList&quot;: [</p>
        <p>{ &quot;value&quot;: 0, &quot;caption&quot;: &quot;&#x6B66;&#x6C49;&#x5E02;&quot;,
          &quot;displayIf&quot;: { &quot;province&quot; : 0 }, &quot;desc&quot;:
          &quot;&#x7B80;&#x79F0;&apos;&#x6C49;&apos;&#xFF0C;&#x522B;&#x79F0;&#x6C5F;&#x57CE;&#x3001;&#x4E1C;&#x65B9;&#x829D;&#x52A0;&#x54E5;&quot;
          },</p>
        <p>{ &quot;value&quot;: 1, &quot;caption&quot;: &quot;&#x8346;&#x5DDE;&#x5E02;&quot;,
          &quot;displayIf&quot;: { &quot;province&quot; : 0 } },</p>
        <p>{ &quot;value&quot;: 2, &quot;caption&quot;: &quot;&#x5B9C;&#x660C;&#x5E02;&quot;,
          &quot;displayIf&quot;: { &quot;province&quot; : 0 } },</p>
        <p>{ &quot;value&quot;: 0, &quot;caption&quot;: &quot;&#x957F;&#x6C99;&#x5E02;&quot;,
          &quot;displayIf&quot;: { &quot;province&quot; : 1 } },</p>
        <p>{ &quot;value&quot;: 1, &quot;caption&quot;: &quot;&#x5CB3;&#x9633;&#x5E02;&quot;,
          &quot;displayIf&quot;: { &quot;province&quot; : 1 } }
          <br />]</p>
        <p>value &#x4E3A;&#x679A;&#x4E3E;&#x503C;&#x3002;&#x5FC5;&#x586B;&#x3002;</p>
        <p>caption &#x679A;&#x4E3E;&#x4E2D;&#x6587;&#x540D;&#x3002;&#x5FC5;&#x586B;&#x3002;</p>
        <p>displayIf &#x5982;&#x679C;&#x6307;&#x5B9A;&#x5C5E;&#x6027;&#x503C;&#x5BF9;&#xFF0C;&#x624D;&#x4F1A;&#x663E;&#x793A;&#x3002;&#x975E;&#x5FC5;&#x586B;&#x3002;&#x5982;&#x679C;&#x4E0D;&#x586B;&#xFF0C;&#x76F4;&#x63A5;&#x663E;&#x793A;&#x3002;</p>
        <p>desc &#x5BF9;&#x679A;&#x4E3E;&#x503C;&#x7684;&#x63CF;&#x8FF0;&#x3002;&#x8DDF;&#x5728;&#x679A;&#x4E3E;&#x4E2D;&#x6587;&#x540D;&#x540E;&#x7F6E;&#x7070;&#x663E;&#x793A;&#x3002;&#x975E;&#x5FC5;&#x586B;&#x3002;</p>
      </td>
    </tr>
  </tbody>
</table>### STRING 字符串

[示例链接](https://github.com/uhziel/gxeditor/blob/bb5fee3ef8176369ea151415bbef49ad0efcca60/example/template/demo.json#L138)

无特有字段。

### STR\_NAME 字符串名

[示例链接](https://github.com/uhziel/gxeditor/blob/9ac1602dd89f39239f45c5d183a42fded5129846/example/template/demo.json#L136)

STR\_NAME存放字符串的名字，不是字符串的实际内容。比如，我有下面字符串文件\(csv格式\)，如果字符串名填button\_ok，实际内容则是"确定"：

```text
button_ok,确定
button_cancel,取消
```

<table>
  <thead>
    <tr>
      <th style="text-align:left">&#x5B57;&#x6BB5;</th>
      <th style="text-align:left">&#x63CF;&#x8FF0;</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:left">filePath</td>
      <td style="text-align:left">
        <p>&#x5B57;&#x7B26;&#x4E32;&#x6587;&#x4EF6;&#x6240;&#x5728;&#x4F4D;&#x7F6E;&#xFF0C;&#x5B58;&#x653E;&#x76F8;&#x5BF9;&#x6570;&#x636E;&#x76EE;&#x5F55;&#x7684;&#x76F8;&#x5BF9;&#x8DEF;&#x5F84;&#x3002;&#x5FC5;&#x586B;&#x3002;</p>
        <p>&#x5B57;&#x7B26;&#x4E32;&#x6587;&#x4EF6;&#x76EE;&#x524D;&#x4EC5;&#x652F;&#x6301;CSV&#x683C;&#x5F0F;&#xFF0C;&#x7B2C;&#x4E00;&#x4E2A;&#x5B57;&#x6BB5;&#x662F;&#x5B57;&#x7B26;&#x4E32;&#x540D;&#xFF0C;&#x7B2C;&#x4E8C;&#x4E2A;&#x5B57;&#x6BB5;&#x662F;&#x5B57;&#x7B26;&#x4E32;&#x5185;&#x5BB9;&#x3002;</p>
      </td>
    </tr>
    <tr>
      <td style="text-align:left">fileEncoding</td>
      <td style="text-align:left">
        <p>&#x5B57;&#x7B26;&#x4E32;&#x6587;&#x4EF6;&#x7684;&#x7F16;&#x7801;&#x3002;&#x5982;&#x4E0D;&#x586B;&#xFF0C;&#x9ED8;&#x8BA4;&#x4E3A;&quot;utf8&quot;&#x3002;</p>
        <p>&#x5176;&#x4ED6;&#x5E38;&#x7528;&#x7F16;&#x7801;&#xFF0C;&quot;gbk&quot;&#x3002;&#x5168;&#x90E8;&#x53EF;&#x7528;&#x7F16;&#x7801;&#x89C1;
          <a
          href="https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings">https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings</a>
        </p>
      </td>
    </tr>
  </tbody>
</table>### DATETIME 日期时间

[示例链接](https://github.com/uhziel/gxeditor/blob/bb5fee3ef8176369ea151415bbef49ad0efcca60/example/template/demo.json#L154)

无特有字段。

### REF 引用

[示例链接](https://github.com/uhziel/gxeditor/blob/bb5fee3ef8176369ea151415bbef49ad0efcca60/example/template/demo.json#L170)

| 字段 | 描述 |
| :--- | :--- |
| refPath | 引用路径。目前仅支持同数据文件内的元素名，而且这个元素需要有id属性和name属性。 |

### FILE 文件

[示例链接](https://github.com/uhziel/gxeditor/blob/bb5fee3ef8176369ea151415bbef49ad0efcca60/example/template/demo.json#L187)

[图片示例链接](https://github.com/uhziel/gxeditor/blob/bb5fee3ef8176369ea151415bbef49ad0efcca60/example/template/demo.json#L203)

<table>
  <thead>
    <tr>
      <th style="text-align:left">&#x5B57;&#x6BB5;</th>
      <th style="text-align:left">&#x63CF;&#x8FF0;</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:left">fileType</td>
      <td style="text-align:left">&#x6587;&#x4EF6;&#x7C7B;&#x578B;&#x3002;&#x53EF;&#x4EE5;&#x8BBE;&#x7F6E;&#x4E3A;&#x56FE;&#x7247;&quot;IMAGE&quot;&#x3001;&#x58F0;&#x97F3;&quot;SOUND&quot;&#x3002;&#x5982;&#x4E0D;&#x586B;&#xFF0C;&#x5C31;&#x662F;&#x666E;&#x901A;&#x6587;&#x4EF6;&#xFF0C;&#x6CA1;&#x6709;&#x9488;&#x5BF9;&#x5B83;&#x7684;&#x4F18;&#x5316;&#x3002;</td>
    </tr>
    <tr>
      <td style="text-align:left">rootDir</td>
      <td style="text-align:left">
        <p>&#x5B58;&#x653E;&#x6587;&#x4EF6;&#x8DEF;&#x5F84;&#x65F6;&#xFF0C;&#x662F;&#x76F8;&#x5BF9;&#x5BF9;rootDir&#x7684;&#x76F8;&#x5BF9;&#x8DEF;&#x5F84;&#x3002;</p>
        <p>&#x5982;&#x4E0D;&#x586B;&#xFF0C;rootDir&#x5C31;&#x662F;data&#x6587;&#x4EF6;&#x5939;&#x672C;&#x8EAB;&#x3002;</p>
      </td>
    </tr>
    <tr>
      <td style="text-align:left">pathSep</td>
      <td style="text-align:left">&#x8DEF;&#x5F84;&#x5206;&#x5272;&#x7B26;&#x3002;&#x652F;&#x6301;&#x586B;&quot;/&quot;&#x3001;&quot;\\&quot;(&#x5373;\)&#x3002;&#x5982;&#x4E0D;&#x586B;&#xFF0C;&#x9ED8;&#x8BA4;&#x4E3A;&quot;\&quot;&#x3002;</td>
    </tr>
  </tbody>
</table>