= xonomy源代码解读

* Xonomy.render xml_as_string/xml document/js_surrogate -> rendered xml document
  * Xonomy.renderElement js_surrogate -> rendered xml document
  * Xonomy.renderAttribute js_surrogate -> rendered xml document
  * Xonomy.renderText js_surrogate -> rendered xml document
  * Xonomy.renderDisplayText
  * Xonomy.nextID 辅助函数。方便生成rendered xml_as_string上元素/属性/文本等的唯一id。
* Xonomy.harvest rendered dom -> xml_as_string
  * Xonomy.harvestElement 会递归harvest。rendered dom -> js_surrogate、创建 js_surrogate
  * Xonomy.harvestAttribute rendered dom -> js_surrogate、创建 js_surrogate
  * Xonomy.harvestText rendered dom -> js_surrogate、创建 js_surrogate
  * Xonomy.harvestParentOf harvest父元素 rendered dom -> js_surrogate
  * Xonomy.enrichElement 补强Element的js_surrogate
* js <-> xml
  * Xonomy.js2xml js_surrogate -> xml_as_string
  * Xonomy.xml2js xml_as_string/xml document -> js_surrogate 
* Xonomy.verifyDocSpecElement 补全文档规格元素上没有的属性
  * Xonomy.verifyDocSpecMenuItem
  * Xonomy.verifyDocSpecAttribute
  * Xonomy.asFunction 辅助函数。方便把属性值转化为函数。
* Xonomy.verifyDocSpec 补全文档规格自身上没有的属性
* Xonomy.refresh 对 rendered xml document 做出整理，包括textByLang。在 Xonomy.render、Xonomy.onchanged 里使用。
* Xonomy.changed rendered xml document 的内容被修改的处理
* Xonomy.validate 检验用户的数据是否有逻辑问题。
* 操作 rendered xml document 的一些方法
  * Xonomy.deleteAttribute
  * Xonomy.deleteElement
  * Xonomy.newAttribute
  * Xonomy.newElementChild
  * Xonomy.newElementBefore 没实现undo
  * Xonomy.newElementAfter 没实现undo
  * Xonomy.duplicateElement
  * Xonomy.moveElementUp 没实现undo
  * Xonomy.moveElementDown 没实现undo
  * Xonomy.mergeWithPrevious 没实现undo
  * Xonomy.mergeWithNext 没实现undo
* 数据
  * Xonomy.docSpec 文档的规格
  * Xonomy.harvestCache js_surrogate的缓存
  * Xonomy.lastIDNum 最近的id
  * Xonomy.warnings 警告信息
* xml数据的几个层面 xml_as_string -> xml document -> js_surrogate -> rendered xml document