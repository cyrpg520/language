## 一、项目说明

    最近公司有个项目需要给官网及子站点做国际化，需要支持7门语言，按照传统的框架解决方案，是在服务端和前端都定义不同版本的语言包，通过语言标识来调用不同的语言包实现语言版本的切换。但是该方案对于前后台改造成本都比较大，如果是要实现内容的国际化，需要在数据库、后台UI、逻辑处理上都要进行改造升级，7门语言工作量可想而知。但是我最不能容忍的是业务数据与翻译数据的耦合，让开发人员，运营人员在开发或添加内容的时候不得不考虑多语言的问题，这是很蛋疼的事情。所以我只能另辟蹊径，寻找更简单更通用的方式来实现国际化的项目。
	
	传统的多语言方案本质上就是通过预先定义好的不同的语言包，通过代码进行切换，是静态方案。目前，我们通过动态方案，已经在测试和生产上都有部署，效果还不错。实质就是预先将所有的文本信息翻译好，做好映射保存到数据库，然后页面刷新时，抓取页面所有的文本信息，作为参数请求接口获取对应语言包的数据，然后遍历页面每个节点文本信息进行自动替换。关键在于两部分，一是怎么人工翻译页面，二是怎么自动翻译文本。
	
	人工翻译我们使用可视化编辑的形式，翻译人员直接在页面上面编辑需要翻译的内容，然后保存即可


##  二、使用说明


#### 1.引入js文件
在当前项目公共部分引入以下js文件
```javascript
<script id="langScript" src="https://user-admin.sanyglobal.com/statics/js/language.js?siteid=202104201128546850"></script>
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

#### 4.服务端接口

- 保存语言包接口


> https://user-admin.sanyglobal.com/admin/lang/save

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

> https://user-admin.sanyglobal.com/openapi/language/translate

- POST

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|site_id |是  |string |站点ID   |
|lang |是  |string | 语言版本    |
|name[] |是  |array | 原始文本sha1加密数组    |

- 清除语言包缓存接口

> https://user-admin.sanyglobal.com/admin/lang/clear

- POST

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|site_id |是  |string |站点ID   |
|lang |是  |string | 语言版本    |

- HEADER请求头

|参数名|必选|类型|说明|
|:----    |:---|:----- |-----   |
|token |否  |string |访问令牌,服务端验证   |

## 三、语言翻译

    通过后台，进入可视化编辑界面，系统会自动识别页面文本信息，双击左键或单击右键进行文本内容的编辑，页面翻译完成后，点击底部保存按钮即可。
