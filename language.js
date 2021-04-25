(function(win){
    /**
     * 辅助工具类
     */
    function Tools(Lang){
        this.$Lang = Lang;
    }
    Tools.prototype = {
        sha1: function(s){
            var data = new Uint8Array(this.encodeUTF8(s));
            var i, j, t;
            var l = ((data.length + 8) >>> 6 << 4) + 16, s = new Uint8Array(l << 2);
            s.set(new Uint8Array(data.buffer)), s = new Uint32Array(s.buffer);
            for (t = new DataView(s.buffer), i = 0; i < l; i++)s[i] = t.getUint32(i << 2);
            s[data.length >> 2] |= 0x80 << (24 - (data.length & 3) * 8);
            s[l - 1] = data.length << 3;
            var w = [], f = [
                    function () { return m[1] & m[2] | ~m[1] & m[3]; },
                    function () { return m[1] ^ m[2] ^ m[3]; },
                    function () { return m[1] & m[2] | m[1] & m[3] | m[2] & m[3]; },
                    function () { return m[1] ^ m[2] ^ m[3]; }
                ], rol = function (n, c) { return n << c | n >>> (32 - c); },
                k = [1518500249, 1859775393, -1894007588, -899497514],
                m = [1732584193, -271733879, null, null, -1009589776];
            m[2] = ~m[0], m[3] = ~m[1];
            for (i = 0; i < s.length; i += 16) {
                var o = m.slice(0);
                for (j = 0; j < 80; j++)
                    w[j] = j < 16 ? s[i + j] : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1),
                        t = rol(m[0], 5) + f[j / 20 | 0]() + m[4] + w[j] + k[j / 20 | 0] | 0,
                        m[1] = rol(m[1], 30), m.pop(), m.unshift(t);
                for (j = 0; j < 5; j++)m[j] = m[j] + o[j] | 0;
            };
            t = new DataView(new Uint32Array(m).buffer);
            for (var i = 0; i < 5; i++)m[i] = t.getUint32(i << 2);

            var hex = Array.prototype.map.call(new Uint8Array(new Uint32Array(m).buffer), function (e) {
                return (e < 16 ? "0" : "") + e.toString(16);
            }).join("");
            return hex;
        },
        encodeUTF8: function(s) {
            var i, r = [], c, x;
            for (i = 0; i < s.length; i++)
                if ((c = s.charCodeAt(i)) < 0x80) r.push(c);
                else if (c < 0x800) r.push(0xC0 + (c >> 6 & 0x1F), 0x80 + (c & 0x3F));
                else {
                    if ((x = c ^ 0xD800) >> 10 == 0) //对四字节UTF-16转换为Unicode
                        c = (x << 10) + (s.charCodeAt(++i) ^ 0xDC00) + 0x10000,
                            r.push(0xF0 + (c >> 18 & 0x7), 0x80 + (c >> 12 & 0x3F));
                    else r.push(0xE0 + (c >> 12 & 0xF));
                    r.push(0x80 + (c >> 6 & 0x3F), 0x80 + (c & 0x3F));
                };
            return r;
        },
        query: function(url,name){
            var val = '';
            var params = url.split('?')[1] || null;
            if (!params) return '';
            params.split('&').forEach(function(r){
                if (r.split('=')[0] == name){
                    val = r.split('=')[1];
                    return ;
                }
            });
            return val;
        },
        get: function(url,callback,headers){
            var xhr=new XMLHttpRequest();
            xhr.open('GET',url,false);
            for (var k in headers){
                xhr.setRequestHeader(k,headers[k]);
            }
            xhr.onreadystatechange=function(){
                if(xhr.readyState==4){
                    if(xhr.status==200 || xhr.status==304){
                        try{
                            callback(JSON.parse(xhr.responseText));
                        }catch (e){
                            console.error(e);
                            alert('请重新登录');
                        }
                    }
                }
            };
            xhr.send();
        },
        post: function(url,data,callback,headers){
            var xhr=new XMLHttpRequest();
            xhr.open('POST',url,false);
            for (var k in headers){
                xhr.setRequestHeader(k,headers[k]);
            }
            xhr.onreadystatechange=function(){
                if (xhr.readyState==4){
                    if (xhr.status==200 || xhr.status==304){
                        try{
                            callback(JSON.parse(xhr.responseText));
                        }catch (e){
                            console.error(e);
                            alert('请重新登录');
                        }
                    }
                }
            };
            xhr.send(data);
        },
        // 获取token
        getToken: function(){
            var token = this.query(window.location.href,this.$Lang.config.token);
            if (token){
                localStorage.setItem(this.$Lang.config.token,token);
            }
            return localStorage.getItem(this.$Lang.config.token);
        },
        // 获取站点ID
        getSiteid: function(){
            return this.query(document.getElementById('langScript').getAttribute('src'),'siteid') || '';
        }
    };

    /**
     * 语言处理类
     */
    function Lang(){
        this.data = {}; // 视图绑定数据
        this.saveData = {}; // 保存提交数据
        this.nodes = {};    // 观察者节点
        this.config = {
            token: "lang-token",
            cookie: "$lang",
            languages: {
                en: "英文",
                zh: "中文"
            },
            host: "http://user-admin.sany-test.com"    // 服务端
        };
        this.$Tools = new Tools(this);

        this.setConfig = function(key,val){
            this.config[key] = val;
        };
        this.init = function(dom){
            this.loopNodes(dom || document.body);
            this.trans(Object.keys(this.data));
            this.render();
            if (this.$Tools.getToken()) this.editMode(); // 进入编辑模式
        };
        /**
         * 进入编辑模式
         */
        this.editMode = function(){
            var $this = this;
            // 插入编辑菜单
            var shadow_root = document.createElement('div');
            document.body.appendChild(shadow_root);
            var root = shadow_root.attachShadow({mode:"open"});
            var elem = document.createElement('div');
            elem.style = 'width: 100%;height: 50px;line-height: 50px;background-color: #1E9FFF;color: #ffffff;text-align: center;position:fixed;margin-top:50px;bottom:0;z-index:99999;';
            var menu = '翻译模式  <select id="sany-lang-drop"><option value="">切换语言</option>';
            var select = '';
            for (var m in $this.config.languages){
                if (m == localStorage.getItem($this.config.cookie)) {
                    select = ' selected';
                }else{
                    select = '';
                }
                menu += '<option value="'+m+'" '+select+'>'+$this.config.languages[m]+'</option>';
            }
            menu += '</select> <button type="button" id="sany-lang-logout">退出编辑模式</button> <button id="sany-lang-save">保 存</button> <button id="sany-lang-clear">清除缓存</button>';
            elem.innerHTML = menu;
            root.appendChild(elem);
            // 插入可编辑样式表
            var head = document.getElementsByTagName('head').item(0);
            var style = document.createElement('style');
            style.type = 'text/css';
            style.appendChild(document.createTextNode("body{padding-bottom:50px}.sany-box-selection-site{border:2px red solid !important;cursor:pointer}"));
            head.appendChild(style);
            // 注册已标记元素事件
            $this.listener(document.body);
            // 数据保存
            root.getElementById('sany-lang-save').addEventListener('click',function(e){
                $this.save();
            });
            // 退出编辑模式
            root.getElementById('sany-lang-logout').addEventListener('click',function(e){
                localStorage.setItem($this.config.token,'');
                window.location.href = window.location.href.split('?')[0];
            });
            // 清除缓存
            root.getElementById('sany-lang-clear').addEventListener('click',function(e){
                var lang = window.localStorage.getItem($this.config.cookie);
                if (!lang){
                    alert('请选择语言版本');
                    return;
                }
                $this.$Tools.get($this.config.host+'/admin/lang/clear?siteid='+$this.$Tools.getSiteid()+'&lang='+lang,function(resp){
                    alert(resp.msg);
                },{
                    token:$this.$Tools.getToken()
                });
            });
            // 绑定语言切换事件
            root.getElementById('sany-lang-drop').addEventListener('change',function(e){
                var val = e.target.options[e.target.selectedIndex].value;
                localStorage.setItem($this.config.cookie,val);
                location.reload();
            });
        };
        // 弹出层
        this.layer = function(html){
            var div = document.createElement('div');
            div.style = 'width:200px;max-height:400px;position:fixed;left:50%;top:30%;margin-left:-100px;padding:10px;background-color:white;border-radius:15px;border:10px rgba(30, 159, 255, 0.5) solid;z-index:999;';
            div.innerHTML = '<div style="position:relative;"><a href="javascript:;" style="position:absolute;width:20px;height:20px;background-color:black;opacity:0.5;top:-25px;right:-25px;padding:3px;border-radius: 100%;color:white;text-align: center;line-height: 20px;text-decoration: none;z-index:99999">X</a><div style="overflow: scroll;max-height: 380px">'+html+'</div></div>';
            document.body.appendChild(div);
            div.querySelector('a').onclick = function(){
                div.remove();
            };
            return div;
        };
        /**
         * 进入文本编辑
         */
        this.contextMenu = function(e){
            var $this = this;
            if (e.target.hasAttribute('lang-id')){
                var lang = localStorage.getItem($this.config.cookie) || '';
                if (!lang){
                    alert('请选择语言');
                    return;
                }
                e.target.setAttribute('contenteditable',true);
                e.target.focus();
            }
            if (e.target.tagName == 'SELECT'){
                var html = '';
                Object.keys(e.target.options).forEach(function(item){
                    html += '<p>'+e.target.options[item].innerText+'</p>';
                });
                var layer = $this.layer(html);
                layer.querySelectorAll('p').forEach(function(n,i){
                    n.firstChild.lang_id = e.target.options[i].lang_id;
                });
            }
        };
        /**
         * 注册标记元素事件
         */
        this.listener = function(dom){
            var $this = this;
            var listener = function(node){
                // 自动选出数据节点
                node.addEventListener('mouseover',function(e){
                    if (e.target.hasAttribute('lang-id')) e.target.classList.add('sany-box-selection-site');
                });
                // 自动取消数据节点
                node.addEventListener('mouseout',function(e){
                    if (e.target.hasAttribute('lang-id')) e.target.classList.remove('sany-box-selection-site');
                });
                // 右键进入可编辑状态
                node.addEventListener('contextmenu',function(e){
                    $this.contextMenu(e);
                    e.preventDefault();
                    return false;
                });
                // 双击进入可编辑状态
                node.addEventListener('dblclick',function(e){
                    $this.contextMenu(e);
                    e.preventDefault();
                    return false;
                });
                // 光标离开事件
                node.addEventListener('focusout',function(e){
                    if (e.target.hasAttribute('lang-id')){
                        e.target.setAttribute('contenteditable',false);
                        var value,lang_id;
                        if (e.target.hasAttribute('lang-edit')){
                            // 富文本
                            lang_id = e.target.lang_id;
                            value = e.target.innerHTML;
                        }else if (e.target.firstElementChild){
                            // 带子元素文本
                            lang_id = e.target.lang_id;
                            value = e.target.innerText;
                        }else{
                            // 单文本
                            if (e.target.firstChild){
                                lang_id = e.target.firstChild.lang_id || e.target.lang_id;
                                value = e.target.firstChild.nodeValue;
                            }else{
                                lang_id = e.target.lang_id;
                                value = '';
                            }
                        }
                        console.log(lang_id + ':' + value);
                        $this.saveData[lang_id] = value;
                        $this.data[lang_id] = value;
                    }
                });
            };
            if (dom.hasAttribute('lang-id')) listener(dom);
            dom.querySelectorAll('[lang-id]').forEach(function(node){
                listener(node);
            });
        };
        /**
         * 监听异步加载页面
         */
        this.render = function(){
            var $this = this;
            var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
            if (!!MutationObserver){
                var observer = new MutationObserver(function(records){
                    var keys = [];
                    records.map(function(record) {
                        record.addedNodes.forEach(function(item){;
                            if (item.nodeType == 1){
                                $this.loopNodes(item);
                                if ($this.$Tools.getToken()) $this.listener(item);  // 编辑模式下
                                var addKeys = function(node){
                                    if (node.firstElementChild){
                                        // 富文本
                                        var lang_id = node.lang_id;
                                    }else{
                                        // 单文本
                                        var lang_id = node.firstChild.lang_id || node.lang_id;
                                    }
                                    if (lang_id) keys.push(lang_id);
                                };
                                if (item.hasAttribute('lang-id')) addKeys(item);    // 处理当前节点
                                item.querySelectorAll('[lang-id]').forEach(function(node){
                                    addKeys(node);  // 处理子节点
                                });
                            }
                        });
                    });
                    if (keys.length){
                        $this.trans(keys);
                        keys = [];
                    }
                });
                observer.observe(document.body,{
                    childList:true,
                    subtree:true
                });
            }else{
                console.warn('不支持页面变化监听');
            }
        };
        /**
         * 添加观察者
         */
        this.wather = function(key,node){
            var $this = this;
            if (!$this.nodes.hasOwnProperty(key)){
                $this.nodes[key] = new Array;
            }
            $this.nodes[key].push(node);
            return {
                set: function(val){
                    $this.nodes[key].forEach(function(n){
                        if (n.nodeType == 1){
                            n.innerHTML = val;  // 更新元素节点
                        }else if(n.nodeType == 3){
                            n.nodeValue = val;   // 更新文本节点
                        }
                    });
                }
            }
        };
        /**
         * 遍历子节点
         */
        this.loopNodes = function(elem){
            var childNodes = elem.childNodes,$this = this,val;
            [].slice.call(childNodes).forEach(function(node){
                // 元素节点
                if (node.childNodes && node.childNodes.length){
                    // 自定义编辑器节点
                    if (node.hasAttribute('lang-edit')){
                        val = node.innerHTML;
                        var key = $this.$Tools.sha1(val);
                        node.lang_id = key; // 标记唯一ID
                        node.setAttribute('lang-id','');    // 标记自动识别标识
                        $this.bind(key,$this.wather(key,node));
                    }else if (node.tagName == 'SELECT'){
                        // 下拉框元素
                        node.setAttribute('lang-id','');    // 标记自动识别标识
                        $this.loopNodes(node);
                    }else{
                        // 递归子节点
                        $this.loopNodes(node)
                    }
                }else{
                    // 文本节点
                    if (node.nodeType == 3 && node.nodeValue.trim() && ["SCRIPT","STYLE"].indexOf(node.parentNode.tagName) == -1) {
                        val = node.nodeValue;
                        var key = node.hasOwnProperty('lang_id') ? node.lang_id : $this.$Tools.sha1(val);
                        node.lang_id = key;    // 标记唯一ID
                        node.parentNode.lang_id = key;
                        node.parentNode.setAttribute('lang-id',''); // 标记自动识别标识
                        $this.bind(key,$this.wather(key,node));
                    }
                }
            });
        };
        /**
         * 数据与视图绑定
         */
        this.bind = function(key,wather){
            if (!this.data.hasOwnProperty(key)){
                Object.defineProperty(this.data,key,{
                    enumerable: true,
                    set: function(val){
                        wather.set(val);
                    }
                });
            }
        };
        /**
         * 配置保存
         */
        this.save = function(){
            var lang = localStorage.getItem(this.config.cookie);
            if (Object.keys(this.saveData).length <= 0){
                alert('未检测到更新');
                return;
            }
            if (!lang){
                alert('请选择语言版本');
                return;
            }
            var formData = new FormData,$this = this;
            formData.append("site_id",$this.$Tools.getSiteid());
            formData.append("lang",lang);
            formData.append("name", JSON.stringify(this.saveData));
            $this.$Tools.post($this.config.host+'/admin/lang/save',formData,function(resp){
                alert(resp.msg);
                if (resp.code == 1){
                    $this.saveData = {};
                }
            },{
                token: localStorage.getItem($this.config.token)
            });
        };
        /**
         * 文本数据翻译
         */
        this.trans = function(keys){
            var $this = this;
            var formData = new FormData;
            var lang = localStorage.getItem($this.config.cookie);
            var site_id = $this.$Tools.getSiteid();
            if (site_id && lang && keys.length){
                formData.append("site_id",site_id);
                formData.append("lang",lang);
                keys.forEach(function(k){
                    formData.append("name[]",k);
                });
                $this.$Tools.post($this.config.host+'/openapi/language/translate',formData,function(resp){
                    if (resp.code && Object.keys(resp.data).length){
                        for (var key in resp.data){
                            $this.data[key] = resp.data[key];
                        }
                    }
                },{
                    token: localStorage.getItem($this.config.token)
                });
            }
        };
    }
    win.$Lang = Lang;
})(window);
