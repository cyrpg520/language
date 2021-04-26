## 一、项目说明
	
传统的多语言方案是通过预先定义好的不同的语言包，通过代码进行切换，属于静态方案。目前，我们通过动态方案，实质就是预先将当前页面的文本信息翻译好，做好映射保存到数据库，然后页面刷新时，抓取页面所有的文本信息，作为参数请求接口获取对应语言包的数据，然后遍历页面每个节点文本信息进行自动替换。`关键在于两部分，一是如何对文本信息进行翻译并保存，二是刷新页面怎么自动将文本进行翻译。`
	
- **如何对文本信息进行翻译并保存**。使用可视化编辑的模式，翻译人员直接在页面上面编辑需要翻译的内容，然后保存即可。

- **刷新页面怎么自动将文本进行翻译**。页面加载完成后，会遍历所有文本节点，然后将每个文本通过sha1加密，放到数组中作为参数请求翻译API，然后将返回的语言包进行文本替换，替换逻辑通过数据与视图绑定(`defineProperty`)来实现。异步加载页面文本替换通过`MutationObserver`事件监听插入dom节点的变化


## 二、使用说明


#### 1.引入js文件
在当前项目公共部分引入以下js文件
```javascript
<script id="langScript" src="http://user-admin.sany-test.com/statics/js/language.js?siteid=你的站点ID"></script>
```

#### 2.初始化
```javascript
<script>
    var Lang = new $Lang;
    Lang.init(document.body);
</script>
```
`Lang.init()方法`：可以设置生效的dom元素，留空则默认 `document.body` 及所有子元素有效

#### 3.参数设置
`Lang.init()` 前，已预定义一些参数，可重写参数配置,如：
```
Lang.setConfig("lang","$lang");     // 语言切换标识名，默认：$lang，存储在localStorage

Lang.setConfig("languages",{
                "en": "英文",
                "zh": "中文"
            });     // 语言版本选项，默认：`{"en": "英文","zh": "中文"}`

Lang.setConfig("save_host","");  // 保存语言包接口
Lang.setConfig("translate_host","");  // 语言包翻译接口
Lang.setConfig("clear_host","");  // 清除语言包缓存接口
```

#### 4.节点标记
对于普通的文本节点均能自动识别并进行文本修改，但有两个节点比较特殊：SELECT元素和富文本编辑器(目前测试发现的)。SELECT元素无法通过contenteditable进行修改，系统处理方案是通过弹层，将OPTION节点的文本复制到弹层中，然后进行编辑。富文本内容需要在富文本的容器元素添加 `lang-edit` 属性，这样系统就不会解析内 lang-edit 元素内的文本节点，可以实现对富文本的统一修改，如果不加该标记，就会解析富文本中所有的文本节点，使翻译工作量加大。

## 二、服务端接口

- 保存语言包接口


> http://user-admin.sany-test.com/admin/lang/save

- POST

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|site_id |是  |string |站点ID   |
|lang |是  |string | 语言版本    |
|name |是  |string | 语言包对象字符串    |

- HEADER请求头

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|token |否  |string |访问令牌,服务端验证   |


- 语言包翻译接口

> http://user-admin.sany-test.com/openapi/language/translate

- POST

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|site_id |是  |string |站点ID   |
|lang |是  |string | 语言版本    |
|name[] |是  |array | 原始文本sha1加密数组    |

- 清除语言包缓存接口

> http://user-admin.sany-test.com/admin/lang/clear

- POST

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|site_id |是  |string |站点ID   |
|lang |是  |string | 语言版本    |

- HEADER请求头

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|token |否  |string |访问令牌,服务端验证   |

## 三、操作流程

1. 进入后台，添加站点，填写站点名称和域名信息，保存。(测试地址：http://user-admin.sany-test.com/admin/index/index  测试账号:lang_test/sany123456)
![](http://showdoc.sany-test.com/server/index.php?s=/api/attachment/visitFile/sign/fa3cee02f1b78fcb472d28c59cfe655b)

![](http://showdoc.sany-test.com/server/index.php?s=/api/attachment/visitFile/sign/db67ab9a2f0130dfb8afc997f5242162)

2.复制js代码，按文档第二部分的使用说明，放到公共地方。
![](http://showdoc.sany-test.com/server/index.php?s=/api/attachment/visitFile/sign/5fdf18785819730b8be87e2eecaec770)

3.进入可视化模式，对站点进行翻译
![](http://showdoc.sany-test.com/server/index.php?s=/api/attachment/visitFile/sign/4d0b0b705cdeb0a63fae18b1f2ad381e)

`服务端后台和接口可以根据文档自行实现`

## 四、扩展

**APP端的实现**，实现原理应该大同小异，可能实现可视化编辑比较困难，希望各位大牛能提供解决方案，本人主后端开发，主要提供解决方案和思路，希望前端大神能够进行优化及完善
