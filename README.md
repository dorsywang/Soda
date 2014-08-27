Soda
====

前端框架，Front End Framework

##简介

Soda是基于逻辑层抽像的前端框架,致力于更高效,便捷,优雅的构建 开发复杂的前端工程.Soda是基于MVC的传统架框方法,抽象所有的前端模型进行封装.

##方法参考

###RenderModel 
###普通渲染模型
    其实前端大多数的操作,无非抽象为,从cgi取到数据然后把数据展示出来.普通的渲染模型即是,从cgi取到数据,通过模型进行数据处理后交给视图层去使用.

####配置参数
#####cgiName {string}  请求的cgi路径
#####renderTmpl 渲染的模板对象
#####renderContainer {string} | {jqueryObj} 渲染到的元素
#####param {function}|{object} cgi的请求参数

#####data {object} 可选的 如果存在data就会使用data渲染模板而不请求cgi
#####renderTool {object} 渲染模板时候可用的工具函数对像
```javascript
var render = new RenderModel({
    renderTool: {
        formatTime: funtion(t){
            return "2014";
        }
    }
    
})

//模板中可以直接用

<div><%=$Tool.formatTime('a')%></div>
```
#####processData {function} 对数据的加工与处理，此时

```javascript
var render = new RenderModel({
    cgiName: "",
    
})
