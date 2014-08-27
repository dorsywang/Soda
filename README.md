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
var render = new RenderModel({
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
var render = new RenderModel({
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
var render = new RenderModel({
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
var render = new RenderModel({
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
var render = new RenderModel({
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
var render = new RenderModel{
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

var render2 = render.extend({
    myData: {
        type: 300
    }
});
```
#####events {function} 此模块的事件绑定 代码内做了防止多次事件绑定，<span style="color:red">被继承的事件也只会执行一次</span>
```javascript
var render = new RenderModel({
    events: function(){
        $("#list").on("tap", function(e){
        
        });
    }
});

// render2继承了render的events，events不会再次执行
var render2 = render.extend({
});

// render3定义了events，render3的events会继续执行
var render3 = render.extend({
    events: function(){
        $("#list2").on("tap", function(e){
            
        });
    }
});
```
#####onreset {function} 模型被重置（调用了reset方法）前触发的操作，重置请参考reset方法
#####noRefresh {boolean} true： 模型调用resfresh方法时，不进行任何操作，false： 会执行refresh操作

####模型方法
#####rock 使模型开始

