# gxproject.json

配置文件内容

```javascript
{
    "dataDirPath": "data",
    "wikiPage": "https://github.com/uhziel/gxeditor/wiki/${dataBasename}"
}
```

## dataDirPath

指定了data文件夹的路径。必填。

这里的路径是相对于项目文件夹的路径（也就是gxproject.json所在的文件夹）。允许包含上级目录".."。

## wikiPage

wiki页面的路径。非必填。

在"打开wiki"时，${dataBasename}被替换为数据文件的名字。如果没有"wikiPage"这个选项，则在右键菜单中不会出现"打开wiki"。

