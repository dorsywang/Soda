Soda
====

前端框架，Front End Framework

##简介

Soda是基于逻辑层抽像的前端框架,致力于更高效,便捷,优雅的构建 开发复杂的前端工程.Soda是基于MVC的传统架框方法,抽象所有的前端模型进行封装.

##方法参考

###RenderModel
####普通渲染模型
>其实前端大多数的操作,无非抽象为,从cgi取到数据然后把数据展示出来.普通的渲染模型即是,从cgi取到数据,通过模型进行数据处理后交给视图层去使用.


| d |s    |
|--:|:--- |
| b |s    |

```javascript
var render = new RenderModel({
    cgiName: "",
    
})
```
