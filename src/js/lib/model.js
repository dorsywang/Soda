/**
 * model 逻辑层抽象
 * model, abstract model in logic
 * @author dorsywang(王斌)
 * @email 314416946@qq.com
 */

(function(){
    var Config = {
    };

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

    // 逐步代替scrollHandle
    var preScrollTop = 0;
    var scrollHelper = {
        init:function(opt){
            this.container = $(opt.container);
            this.scollEndCallback = opt.scollEndCallback;
            this.scrollToBottomCallback = opt.scrollToBottomCallback;
            this.scrollToHalfCallback = opt.scrollToHalfCallback;
            this.bindHandler();
        },
        bindHandler:function(){
            this.container.on("scroll", $.proxy(this.onScroll,this));
        },

        setScrollEl: function(el){
            this.container.off("scroll", $.proxy(this.onScroll,this));

            this.container = el;

            this.bindHandler();
        },
        //滚动事件
        onScroll:function(e){
            var self = this;
            var container = e.target;
            var scrollTop,
                scrollHeight,
                windowHeight;

            //android 和 ios 5以下版本
            if(container == document){
                scrollTop = window.scrollY;
                windowHeight = window.innerHeight;
                scrollHeight = document.body.scrollHeight;
            }
            //ios 5+版本
            else{
                var style = window.getComputedStyle(container);
                scrollTop = container.scrollTop;
                windowHeight = parseInt(style.height) + parseInt(style.paddingTop) + parseInt(style.paddingBottom) + parseInt(style.marginTop) + parseInt(style.marginBottom);
                scrollHeight = container.scrollHeight;
            }


            //滚动到2/3处
            if (scrollTop + windowHeight >= scrollHeight * 2 / 3 && scrollTop > preScrollTop) {
                this.scrollToHalfCallback && this.scrollToHalfCallback(e);
            }
            //滚动到底部
            else if(scrollTop + windowHeight >= scrollHeight){
                this.scrollToBottomCallback && this.scrollToBottomCallback(e);
            }
            preScrollTop = scrollTop;
        }

    };

    //记录是不是第一次进来
    var isFirstRender = 1;


    // common render logic model, get data and render it using templates
    // the base model of all
    // in fact all web page constructed by this model, get data from cgi and show with views
    var renderModel = function(opt){
        var func = function(){};
        var options = ['renderTmpl', 'renderContainer', 'param', 'processData', 'data', 'renderTool', 'onreset', 'events', 'complete', 'myData', 'error', 'noRefresh'];

        var initOptions =  { 
            paramCache: [],
            cgiCount: 0,
            dataCache: [],
            feedPool: [],
            isFirstRender: 1,
            eventsBinded: 0,
            isFirstDataRequestRender: 0
        };

        // trying to get allowed options
        options.map(function(item){
            func[item] = opt[item] || "";
        });

        // init the options
        for(var i in initOptions){
            func[i] = initOptions[i];
        }

        func.__proto__ = RenderModel.prototype;

        return func;

    };

    renderModel.prototype = {
        type: "renderModel",
        // using ajax to get data
        getData: function(callback){
            var _this = this;

            // if param cached, using cached param
            var param = _this.paramCache[_this.cgiCount] || this.param();

            var opt = {
                url: this.cgiName,
                data: param,
                success: function(res, isLocalRender){
                    if(isLocalRender){
                        callback(res);
                        return;
                    }

                    _this.dataCache[_this.cgiCount] = res;
                    _this.paramCache[_this.cgiCount] = param;

                    _this.cgiCount ++;
                    callback(res);

                    if(_this.cgiCount == 1){
                        var key = getKey(_this.cgiName, param);

                        try{
                            window.localStorage.setItem(key, JSON.stringify(res));
                        }catch(e){
                            window.localStorage.clear();
                            window.localStorage.setItem(key, JSON.stringify(res));
                        }
                    }

                },

                error: function(res){
                    // here need to retry
                    _this.paramCache[_this.cgiCount] = param;
                    _this.cgiCount ++;

                    _this.error && _this.error(res, _this.cgiCount);
                }
            };

            //如果是第一次
            if(_this.cgiCount == 0 && _this.isFirstRender){
                var localData;

                var key = getKey(this.cgiName, param);
                localData = JSON.parse(window.localStorage.getItem(key) || "{}");;

                if(localData.result){
                    opt.success(localData, 1);
                }

                _this.isFirstRender = 0;

            }

            if(this.dataCache[_this.cgiCount]){
                opt.success(this.dataCache[_this.cgiCount]);
            }else{
                // @todo if using jquery or zepto
                $.ajax(opt);
            }

        },
        clearLocalData:function(cgiCount){
            var param = this.paramCache[cgiCount || 0];
            var key = getKey(this.cgiName, param);
            window.localStorage.removeItem(key);
        },
        reset: function(){
            var container = this.renderContainer;
            if(typeof container == "string"){
                container = $(container);
            }
            container.html("");

            this.cgiCount = 0;

            this.onreset && this.onreset();
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

                    _this.isFirstDataRequestRender ++;

                });
            }else{
                if(this.data){
                    if(typeof this.data == "function"){
                        this.data = this.data();
                    }
                }else{
                    this.data = {};
                }

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

                    _this.isFirstDataRequestRender ++;
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
            if(this.noRefresh){
            }else{
                this.dataCache = [];
                this.reset();
                this.rock();
            }
        },

        hide: function(){
            var container = this.renderContainer;
            if(typeof container === "string"){
                container = $(container);
            }

            container.hide();
        },

        show: function(){
            var container = this.renderContainer;
            if(typeof container === "string"){
                container = $(container);
            }

            container.show();
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

            //如果重新定义了param 不使用缓存
            if(opt.param){
                object.paramCache = [];
            }

            func.prototype = object;

            var clone = new func();

            for(var i in opt){
                clone[i] = opt[i];
            }

            return clone;
        },

        freeze: function(){
            this.freezed = 1;
        }
    };

    var scrollHanderPool = [];

    var scrollDom = window;
    if($.os.ios){
        scrollDom = "#js_bar_main";
        if($(scrollDom)[0] == document.body){
            scrollDom = window;
        }
    }
    var scrollArea = scrollDom;

    var scrollModel = function(opt){
       var Render = new renderModel(opt);
       Render.scrollEnable = 1;

       Render.__proto__.eventsBinded = 0;
       Render.type = "scrollModel";

       var events = Render.events;

       Render.events = function(){
            if(this.eventsBinded){
                return;
            }
            events && events.call(this);

            this.eventsBinded = 1;
       };


       return Render;
    };

    var cgiModel = function(opt){
        this.cgiName = opt.cgiName;
        this.param = opt.param;
        this.complete = this.complete;
        this.error = opt.error;

        this.paramCache = [];
        this.cgiCount = 0;
        this.dataCache = [];

        this.feedPool = [];
        this.isFirstRender = 1;
        this.eventsBinded = 0;

        this.isFirstDataRequestRender = 0;

    };

    cgiModel.prototype = {
        getData: renderModel.prototype.getData,
        rock: function(){
            this.getData(function(data){
                this.complete && this.complete(data);
            });
        }
    };

    var handlers = {
        onScrollEnd: function(){},
        onScrollToBottom: function(){},
        onScrollToHalf: function(){
            scrollHanderPool.map(function(item, index){
                if(item.type == "scrollModel"){
                    if(! item.freezed && item.scrollEnable){
                        item.rock();
                        return;
                    }
                }else{

                    if(! item.freezed && item.currModel.type == "scrollModel" && !item.currModel.freezed && item.currModel.scrollEnable){

                        item.currModel.rock();
                    }
                }
            });
        }
    };

    scrollHelper.init({
        container: scrollArea,
        scollEndCallback: handlers.onScrollEnd,
        scrollToBottomCallback: handlers.onScrollToBottom,
        scrollToHalfCallback: handlers.onScrollToHalf
    });


    scrollHelper.addModel = function(model){
        scrollHanderPool.push(model);
    };

    scrollHelper.removeModel = function(model){
        var index = 0;
        scrollHanderPool.map(function(item, i){
            if(item == model){
                index = i;

                scrollHanderPool.splice(i, 1);
                return;
            }
        });
    };


    var mutitabModel = function(){
        this.pool = [];

        this.currModel = null;
    };

    mutitabModel.prototype = {
        rock: function(){
            var _this = this;

            scrollHelper.addModel(this);

            //挂载的渲染模型的渲染信息
            //如果两个或以上模型共用一个渲染container，则使用rest + rock方式
            //其他container就要隐藏
            //如果只有一个模型用container，直接显示即可
            var containerCountInfo = {};

            this.pool.map(function(item, index){
                var selector = item[0];
                var smodel = item[1];

                if(containerCountInfo[smodel.renderContainer]){
                    containerCountInfo[smodel.renderContainer] ++;
                }else{
                    containerCountInfo[smodel.renderContainer] = 1;
                }

                $("body").on('tap', selector, function(){
                    _this.currModel = smodel;

                    if(containerCountInfo[smodel.renderContainer] > 1){
                        _this.currModel.reset();
                        _this.currModel.rock();
                    }else{
                        if(smodel.isFirstDataRequestRender > 0){
                        }else{
                            smodel.rock();
                        }
                    }

                    for(var i in containerCountInfo){
                        var container = i;
                        if(typeof container == "string"){
                            container = $(container);
                        }

                        if(i != smodel.renderContainer){
                            container.hide();
                        }else{
                            container.show();
                        }
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
                    if(selector == _this.initTab){
                        _this.currModel = smodel;
                        _this.currModel.reset();
                        _this.currModel.rock();

                       for(var i in containerCountInfo){
                            var container = i;
                            if(typeof container == "string"){
                                container = $(container);
                            }

                            if(i != smodel.renderContainer){
                                container.hide();
                            }else{
                                container.show();
                            }
                        }

                        $(selector).addClass('active');
                        _this.scrollEnable = _this.currModel.scrollEnable;

                        _this.tabHander && _this.tabHander.call(_this, selector, 'init');
                    }
                }else{

                    if(index == 0){
                        _this.currModel = smodel;
                        _this.currModel.reset();
                        _this.currModel.rock();

                        $(selector).addClass('active');
                        _this.scrollEnable = _this.currModel.scrollEnable;

                        _this.tabHander && _this.tabHander(_this, selector, 'init');
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

        freeze: function(){
            this.freezed = 1;
        },

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

    var pageModel = function(){
        this.models = [];
    };


    pageModel.prototype = {
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
            this.models.map(function(item){
                if(item.feeded){
                }else{
                    item.rock();
                }
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
        reset:function(){
            this.models.map(function(item){
                item.reset();
            });
        },

        hide: function(){
            this.renderContainer.hide();
        },

        show: function(){
            this.renderContainer.show();
        }

    };

    var linkModel = function(opt){
        this.param = opt.param;
        this.url = opt.url;
        this.newWindow = opt.newWindow;
        this.popBack = opt.popBack;
        this.checkBack = opt.checkBack;
    };

    linkModel.prototype = {
        rock: function(){
            var query = "";
            var param = this.param;
            if(typeof this.param === "function"){
                param = this.param.call(this);
            }

            if(this.popBack){
                mqq.ui.popBack();
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
                if(this.checkBack){
                    var referer = document.referrer;
                    if(referer.indexOf(this.url) > -1){
                        history.back();
                        return;
                    }else{
                    }
                }

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

    window.RenderModel = RenderModel;
    window.ScrollModel = scrollModel;
    window.LinkModel = linkModel;
    window.MutitabModel = mutitabModel;
    window.PageModel = pageModel;

    window.ScrollHelper = scrollHelper;

})();
