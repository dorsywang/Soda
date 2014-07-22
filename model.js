   /**
    * 页面模型
    * @dorsywang
    */
var newObject = function(func){
    var obj = {};
    func(obj);

    obj.__proto__ = func.prototype;

    return obj;
};

var getKey = function(cgiName, param){
    var o = {};

    for(var i in param){
        if(i == "sid" || i == "bkn"){
            continue;
        }

        o[i] = param[i];
    }

    var key = cgiName + "_" + JSON.stringify(o);

    return key;
};

//记录是不是第一次进来
var isFirstRender = 1;

var RenderModel = function(opt){
    var func = function(o){
    };

    func.renderTmpl = opt.renderTmpl;
    func.cgiName = opt.cgiName;
    func.renderContainer = opt.renderContainer;
    func.param = opt.param;
    func.processData = opt.processData;
    func.data = opt.data;
    func.renderTool = opt.renderTool;
    func.onreset = opt.onreset;
    func.events = opt.events;
    func.complete = opt.complete;
    func.myData = opt.myData;
    func.error = opt.error;

    func.paramCache = [];
    func.cgiCount = 0;
    func.dataCache = [];

    func.feedPool = [];
    func.isFirstRender = 1;
    func.eventsBinded = 0;

    func.__proto__ = RenderModel.prototype;

    func.prototype = func;

    return func;
};

RenderModel.prototype = {
    type: "RenderModel",
    getData: function(callback){
        var _this = this;

        var param = _this.paramCache[_this.cgiCount] || this.param.call(this);
        // var param = this.param.call(this);

        var opt = {
            url: this.cgiName,
            param: param,
            succ: function(res, isLocalRender){
                if(isLocalRender){
                    callback(res);
                    return;
                }

                _this.dataCache[_this.cgiCount] = res;
                _this.paramCache[_this.cgiCount] = param;

                _this.cgiCount ++;
                callback(res);

                if(_this.cgiCount === 1){
                    var key = getKey(_this.cgiName, param);

                    try{
                        window.localStorage.setItem(key, JSON.stringify(res));
                    }catch(e){
                        window.localStorage.clear();
                        window.localStorage.setItem(key, JSON.stringify(res));
                    }
                }

            },

            err: function(res){
                _this.paramCache[_this.cgiCount] = param;
                _this.cgiCount ++;

                _this.error && _this.error(res, _this.cgiCount);
            }
        };

        //如果是第一次
        if(_this.cgiCount === 0 && _this.isFirstRender){
            var localData;

            var key = getKey(this.cgiName, param);
            localData = JSON.parse(window.localStorage.getItem(key) || "{}");

            if(localData.result){
                opt.succ(localData, 1);
            }

            _this.isFirstRender = 0;

        }

        if(this.dataCache[_this.cgiCount]){
            opt.succ(this.dataCache[_this.cgiCount]);
        }else{
            DB.cgiHttp(opt);
        }
    },

    reset: function(){
        var container = this.renderContainer;
        if(typeof container == "string"){
            container = $(container);
        }
        container.html("");

        // this.cgiCount = 0;

        this.onreset && this.onreset();

        this.feedPool.map(function(item){
            item.reset();
        });
    },

    render: function(container, isReplace){
        var _this = this;
        this.scrollEnable = 0;
        if(typeof container === "string"){
            container = $(container);
        }

        if(this.cgiName){
            this.getData(function(data){
                _this.processData && _this.processData.call(_this, data, _this.cgiCount);

                if(_this.cgiCount == 1) {
                    _this.onreset && _this.onreset();
                    container.html("");
                    Tmpl(_this.renderTmpl, data.result || data, _this.renderTool || {}).appendTo(container);

                }else{
                    Tmpl(_this.renderTmpl, data.result || data, _this.renderTool || {}).appendTo(container);
                }

                _this.scrollEnable = 1;

                if(_this.eventsBinded){
                }else{
                    _this.events && _this.events();
                    _this.eventsBinded = 1;
                }

                _this.feedPool.map(function(item){
                    item.setFeedData(data);

                    item.rock();
                });

                _this.complete && _this.complete(data);

            });
        }else{
            if(this.data){
                _this.processData && _this.processData.call(this, this.data, _this.cgiCount);

                container.html("");
                Tmpl(_this.renderTmpl, this.data.result || this.data, _this.renderTool).update(container);

                if(_this.eventsBinded){
                }else{
                    _this.events && _this.events();
                    _this.eventsBinded = 1;
                }

                _this.scrollEnable = 1;

                _this.feedPool.map(function(item){
                    item.setFeedData(this.data);

                    item.rock();
                });

                _this.complete && _this.complete(this.data);

            }
        }
    },

    rock: function(){
        this.render(this.renderContainer, 1);
    },

    processData: function(data){
    },

    //用自己辛苦拿到的数据哺乳另一个模型
    feed: function(model){
        this.feedPool.push(model);
        model.feeded = 1;
    },

    setFeedData: function(data){
        this.data = data;
    },

    update: function(data){
        this.data = data;

        this.reset();
        this.rock();
    },

    //只刷新数据不更新视图
    resetData: function(){
        this.dataCache = [];
        this.cgiCount = 0;

        this.onreset && this.onreset();
    },

    refresh: function(){
        this.dataCache = [];
        this.reset();
        this.rock();
    },

    extend: function(opt){
        var func = function(){
        };

        var object = {};

        for(var i in this){
            object[i] = this[i];
        }

        object.cgiCount = 0;
        object.dataCache = [];

        if(opt.param){
            object.paramCache = [];
        }

        func.prototype = object;

        var clone = new func();

        for(var i in opt){
            clone[i] = opt[i];
        }

        return clone;
    }
};

// var scrollHanderPool = [];

// var scrollDom = window;
// var scrollArea = scrollDom;

var ScrollModel = function(opt){
    var Render = new RenderModel(opt);
    Render.scrollEnable = 1;

    Render.__proto__.eventsBinded = 0;
    Render.type = "ScrollModel";

    Render.freeze = function(){
        this.freezed = 1;
    };

    var events = Render.events;

    Render.events = function(){
        var _this = this;

        if(this.eventsBinded){
            return;
        }
        events && events();

        // 滚动事件监听
        ScrollHandle.init({
            container: opt.scrollContainer || opt.renderContainer,
            scrollToHalfCallback: function(){
                if((!_this.freezed) && _this.scrollEnable){
                    _this.rock();
                }
            }
        });

        this.eventsBinded = 1;
   };


   return Render;
};

// var handlers = {
//     onScrollEnd: function(){},
//     onScrollToBottom: function(){},
//     onScrollToHalf: function(){
//         scrollHanderPool.map(function(item, index){
//             if(! item.freezed && item.currModel.type == "ScrollModel" && item.currModel.scrollEnable){
//                 item.currModel.rock();
//             }
//         });
//     }
// };

// ScrollHandle.init({
//     container: scrollArea,
//     scollEndCallback: handlers.onScrollEnd,
//     scrollToBottomCallback: handlers.onScrollToBottom,
//     scrollToHalfCallback: handlers.onScrollToHalf
// });


// ScrollHandle.addModel = function(model){
//     scrollHanderPool.push(model);
// };

// ScrollHandle.removeModel = function(model){
//     var index = 0;
//     scrollHanderPool.map(function(item, i){
//         if(item == model){
//             index = i;

//             scrollHanderPool.splice(i, 1);
//             return;
//         }
//     });
// };

var MultiTabModel = function(opt){
    this.pool = [];

    this.currModel = null;
    this.noSwitchRefresh = opt.noSwitchRefresh;
};

MultiTabModel.prototype = {
    rock: function(){
        var _this = this;

        // ScrollHandle.addModel(this);

        this.pool.map(function(item, index){
            var selector = item[0];
            var smodel = item[1];

            $('body').on('click', selector, function(){
                _this.currModel = smodel;

                if(!_this.noSwitchRefresh){
                    _this.currModel.reset();
                    _this.currModel.rock();
                    _this.currModel.hasRocked = true;
                } else if(!_this.currModel.hasRocked) {
                    _this.currModel.rock();
                    _this.currModel.hasRocked = true;
                }

                _this.pool.map(function(item){
                    var s = item[0];

                    $(s).removeClass('active');
                    $(s).removeClass('selected');
                });

                $(selector).addClass('active');

                _this.tabHander && _this.tabHander.call(_this, selector, 'switch');
            });


            if(_this.initTab){
                if(selector === _this.initTab){
                    _this.currModel = smodel;
                    _this.currModel.reset();
                    _this.currModel.rock();
                    _this.currModel.hasRocked = true;

                    $(selector).addClass('active');
                    _this.scrollEnable = _this.currModel.scrollEnable;

                    _this.tabHander && _this.tabHander.call(_this, selector, 'init');
                }
            }else{

                if(index === 0){
                    _this.currModel = smodel;
                    _this.currModel.reset();
                    _this.currModel.rock();
                    _this.currModel.hasRocked = true;

                    $(selector).addClass('active');
                    _this.scrollEnable = _this.currModel.scrollEnable;

                    _this.tabHander && _this.tabHander.call(_this, selector, 'init');
                }
            }

        });
    },

    add: function(selector, smodel){
        smodel._modelSelector = selector;
        this.pool.push([selector, smodel]);
    },

    ontabswitch: function(func){
        this.tabHander = func;
    },

    init: function(tabSelector){
        this.initTab = tabSelector;
    },

    // freeze: function(){
    //     this.freezed = 1;
    // },

    refresh: function(){
        this.currModel.refresh();
    },

    refreshList: function(selector){
        if(this.currModel._modelSelector === selector){
            this.currModel.refresh();
        }else{
            this.currModel.resetData();
        }
    }
};

var PageModel = function(opt){
    this.models = [];
    opt = opt || {};
    this.renderTmpl = opt.renderTmpl;
    this.renderContainer = opt.renderContainer;
    this.events = opt.events;
};


PageModel.prototype = {
    //增加一个渲染模型，大致按cgi去划分
    add: function(model){
        this.models.push(model);
    },

    remove: function(model){
        var index;
        this.models.map(function(item, i){
            if(item == model){
                index = i;
            }
        });

        if(index){
            this.models.splice(index, 1);
        }
    },

    rock: function(){
        // 渲染页面且只渲染一次
        // 这里封装得不爽啊，写在这里总感觉不太对
        if(this.renderTmpl && this.renderContainer) {
            var container = this.renderContainer;
            if(typeof container === "string"){
                container = $(container);
            }
            Tmpl(this.renderTmpl, {}).appendTo(container);
            this.events && this.events();
            this.renderTmpl = null;
        }

        this.models.map(function(item){
            if(item.feeded){
            }else{
                item.rock();
            }
        });
    },

    reset: function(){
        this.models.map(function(item){
            item.reset();
        });
    },

    extend: function(){
        var func = function(){};
        func.prototype = this;


        var son = new func();
        son.parent = this;

        for(var i in son){
            son[i].parent = parent[i];
        }

        return son;
    },

    hide: function(){
        this.renderContainer.hide();
    },

    show: function(){
        this.renderContainer.show();
    }

};

var LinkModel = function(opt){
    this.param = opt.param;
    this.url = opt.url;
    this.newWindow = opt.newWindow;

};

LinkModel.prototype = {
    rock: function(){
        var query = "";
        var param = this.param;
        if(typeof this.param == "function"){
            param = this.param.call(this);
        }

        if(param){
            var tmp = [];
            for(var i in param){
                tmp.push(i + '=' + (param[i] || ""));
            }

            query = tmp.join("&");
        }

        var url;
        if(query){
            url = this.url + "?" + query;
        }else{
            url = this.url;
        }
        if(url){
            if(this.newWindow){
                Util.openUrl(url, true);
            }else{
                Util.openUrl(url);
            }
        }
    },

    reset: function(){
    }
};


window.MultiPageModel = function(opt){
    this.pool = [];
    this.pageTmpl = opt.pageTmpl;
    this.container = typeof opt.renderContainer === 'string'?
        $(opt.renderContainer):
        opt.renderContainer;
};

MultiPageModel.prototype = {

    // 第二个参数是页面间的传参
    open: function(pageName, param){
        // TODO 如果已经在打开的栈里面，则不做任何操作

        var lastPageName = this.pool[this.pool.length - 1] || '';
        var lastPage = window[lastPageName + 'Page'];

        // 如果还没渲染出页面框架，则渲染
        var pageBox = $('#' + pageName + 'PageBox'),
            lastPageTitle = lastPage? lastPage.title || '': '';
        if(!(pageBox.length)) {
            Tmpl(this.pageTmpl, {
                lastPageTitle: lastPageTitle,
                lastPageName: lastPageName,
                pageName: pageName
            }).appendTo(this.container);
        } else {
            // 这里这个封装也不够通用
            // 其实也可以考虑每次打开页面就渲染一个全新的页面节点，不取判断这个页面框架是否存在
            // 每次返回的时候就直接remove
            // 但这样会不会太绝了，不利于做各种返回动画？
            $('.nav-back', pageBox).html(lastPageTitle);
        }

        $('#' + lastPageName + 'PageBox').removeClass('active');
        $('#' + pageName + 'PageBox').addClass('active')
            .css('z-index', this.pool.length);

        // 如果尚未加载页面模型，则加载
        var _this = this;
        var page;
        if(!window[pageName + 'Page']){
            loadjs.loadModule(pageName, function(){
                page = window[pageName + 'Page'];
                page.renderContainer = $('#' + pageName + 'PageBox');
                page.controller = _this;
                page.myData = page.myData || {};
                $.extend(page.myData, param);
                page.rock();
            });
        } else {
            page = window[pageName + 'Page'];
            page.renderContainer = $('#' + pageName + 'PageBox');
            page.controller = _this;
            page.myData = page.myData || {};
            $.extend(page.myData, param);
            page.reset();
            page.rock();
        }

        this.pool.push(pageName);

        this.swtichHandler && this.swtichHandler('open');
    },

    back: function(){
        if(this.pool.length <= 1){
            return;
        }

        var pageName = this.pool.pop();
        var lastPageName = this.pool[this.pool.length - 1];

        $('#' + pageName + 'PageBox').removeClass('active');
        $('#' + lastPageName + 'PageBox').addClass('active');

        this.swtichHandler && this.swtichHandler('back');
    },

    onpageswitch: function(func){
        this.swtichHandler = func;
    }

};