Soda
====

前端框架，Front End Framework

##简介

Soda是基于逻辑层抽像的前端框架,致力于更高效,便捷,优雅的构建 开发复杂的前端工程.Soda是基于MVC的传统架框方法,抽象所有的前端模型进行封装.

##方法参考

###RenderModel 
###普通渲染模型
>其实前端大多数的操作,无非抽象为,从cgi取到数据然后把数据展示出来.普通的渲染模型即是,从cgi取到数据,通过模型进行数据处理后交给视图层去使用.

####配置参数
#####cgiName {string}  请求的cgi路径
#####renderTmpl 渲染的模板对象
视图模板 如果cgi返回数据中有result，直接使用result进行渲染，否则使用原始数据渲染
```javascript
//数据为
data = {
    result: {
        list: [
        ],
        bid: 10038
    },
    retcode: 0
}
```
```html
//模板中
<div data-bid="<%=bid%>">soda</div>
<ul>
<% for(var i = 0; i < list.length; i ++){
%>
    <li>soda</li>
<% }
%>
</ul>
```
#####renderContainer {string} | {jqueryObj} 渲染到的元素
#####param {function}|{object} cgi的请求参数
```javascript
// 页面的头部模块
var header = new RenderModel({
    param: {
        bid: 10038,
        name: 'a'
    }
});
```
或者
```javascript
var bid,name;
// ...
var header = new RenderModel({
    param: function(){
        return {
            bid: bid,
            name: name
        };
    }
});
```
#####data {object} 可选的 如果存在data就会使用data渲染模板而不请求cgi
#####renderTool {object} 渲染模板时候可用的工具函数对像
```javascript
var header = new RenderModel({
    renderTool: {
        formatTime: funtion(t){
            return "2014";
        }
    }
    
});

//模板中可以直接用

<div><%=$Tool.formatTime('a')%></div>
```
#####processData {function} 对数据的加工与处理，此时对当前模板视图内的DOM操作是禁止的
processData的第一个参数为Data，第二个参数为cgi的请求次数
```javascript
var hender = new RenderModel({
    processData: function(res, cgiCount){
        if(cgiCount === 0){
            // cgiCount为0始终是在用本地缓存中的数据 
            // 必要时可进行一些操作
        }
        
        // 注意res为引用传递  想办法修改res而不是覆盖res
    }
    
});
```
#####error {function} cgi请求出错时，一般为网络错误导致 
```javascript
var hender = new RenderModel({
    error: function(res, cgiCount){
        if(cgiCount === 0){
            // cgiCount为0始终是在用本地缓存中的数据 
            // 必要时可进行一些操作
        }
        
    }
    
});
```
#####complete {function} 视图层渲染完成时进行的一些操作，这时可以对视图内的DOM进行处理
参数同processData
#####myData {object} 自定义数据，可以在processData、complete中使用,直接用this.myData引用即可，常用于对继承中的特殊处理
```javascript
var tab1 = new RenderModel{
    myData: {
        type: 100
    },
    processData: function(res){
        if(this.myData == 100){
            res.result.flag = 1;
            //....
        }else if(this.myData == 300){
            res.result.flag = 0;
            //....
        }
    }
};

var tab2 = render.extend({
    myData: {
        type: 300
    }
});
```
#####events {function} 此模块的事件绑定 代码内做了防止多次事件绑定，<span style="color:red">被继承的事件也只会执行一次</span>
```javascript
var tab1 = new RenderModel({
    events: function(){
        $("#list").on("tap", function(e){
        
        });
    }
});

// tab2继承了tab1的events，events不会再次执行
var tab2 = tab1.extend({
});

// tab3定义了events，tab3的events会继续执行
var tab3 = tab1.extend({
    events: function(){
        $("#list2").on("tap", function(e){
            
        });
    }
});
```
#####onreset {function} 模型被重置（调用了reset方法）前触发的操作，重置请参考reset方法
#####noRefresh {boolean} true： 模型调用resfresh方法时，不进行任何操作，false： 会执行refresh操作

####模型方法
#####rock() 使模型开始执行
```javascript
var hender = new RenderModel({

});

hender.rock();
```
#####update(data) 用新的数据更新模型
```javascript
//...

// 模型使用新的数据重新渲染视图
hender.update(data);
```

#####reset() 重置模型
>重置模型，即是，重置模型将会使模型的所有状态回归，但已经请求的数据会缓存，不会重新请求cgi,常跟rock配合使用，用于使用缓存的数据重新渲染视图，对于scrollModel即是重新渲染视图，滚动加载时，有数据会用缓存数据，没有会重新请求cgi进行渲染

reset方法会调用onreset的配置方法


#####refresh() 刷新模型，重新请求cgi，重新渲染
>refresh其实是进行了以下三个步骤：清空缓存数据，调用reset方法重置，调用rock方法完成了模型的刷新操作，refresh方法会执行onreset配置

```javascript
//...

// 点击刷新时，刷新hender的模块
$("#refresh").on("tap", function(e){
   hender.refresh(); 
});

```

#####feed(model) 使用该模型的数据对某模型渲染
>一般来说，某个小模块依赖于某个大模块的cgi返回数据，可以使用此方法

```javascript
var header = new RenderModel({
    cgiName: "/cgi-bin/header",
    //...
});

var navigator = new RenderModel({

});

header.feed(navigator);
header.rock();
```
#####resetData() 要求该模型下次被调用rock方法时去拉最新的数据，常用于model被mutitab管理时，要求刷新某个模型的数据

#####show() 显示模块对应的container
#####hide() 隐藏模快对应的container
#####extend(opt) 从该模块继承一个新的模块
opt即是配置参数，<span style="color:red;">如果没有定义param，则会使用原有可能被缓存的param</span>

```javascript
var tab1 = new RenderModel({
    param: function(){
        return {
            bid: bid,
            name: name
        }
    },
    
    cgiName: '/cgi-bin/tab1',
    renderContainer: ".tab",
    renderTmpl: Tmpl_inline.tab,
    processData: function(data){
        
    }
});

var tab2 = tab1.extend({
    cgiName: '/cgi-bin/tab2'
});

```
#####freeze() 冻结该模块 主要是对于滚动加载的模块，调用此方法可以使不再滚动加载
```javascript
// 滚动加载模型
var tab1 = new ScrollModel({
    param: function(){
        var every = 10;
        var start = - every;
        return function(){
            bid: bid,
            name: name,
            start: start += every,
            every: every
        }
    },
    
    cgiName: '/cgi-bin/tab1',
    renderContainer: ".tab",
    renderTmpl: Tmpl_inline.tab,
    processData: function(data){
        // 数据结束，滚动加载模型冻结
        if(data.isend){
            this.freeze();
        }
    }
});
```
#####melt()  解冻该模块

###ScrollModel
####滚动加载模型
>滚动加载模型继承自renderModel，所以拥有renderModel的所有配置参数和方法
<span style='color:red;'>scrollModel默认的滚动元素在ios下（其子元素比该元素高)是id为”js_bar_main"的元素，android下为window</span>

例子

主文件
```html
    <div class='tabWrapper'>
        <ul class='tab'>
            
        </ul>
    </div>
```

模板文件
```html
    <% for(var i = 0; i < list.length; i ++){
            var item = list[i];
    %>
    <li data-bid="<%=item.bid%>"><%=item.name%></li>
    <% }
    %>
```

js文件
```javascript
var tab1 = new ScrollModel({
    renderContainer: ".tab",
    renderTmpl: Tmpl_inline.tab1,
    cgiName: "/cgi-bin/tab1",
    processData: function(data){
        data.result.flag = 1;
    },
    events: function(){
        $(".tab li").on("tap", function(){
            var bid = $(this).data(bid);
            
            Util.openDetail(bid);
        });
    }
});

tab1.rock();
```
###mutitabModel
####多tab管理模型
>多tab管理模型是管理多个tab之间切换模型，自带刷新，隐藏

