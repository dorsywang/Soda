/**
* 页面模型
* created by dorsywang
* 页面逻辑层的封装
* @2014-7-29 增加注释文档
*/
(function(){
    /**
     * new一个obj
     */
    var DB = {
        cgiHttp: function(opt){
            $.ajax({
                url: opt.url,
                data: opt.param,
                success: function(data){
                    opt.succ(data);
                },

                error: function(data){
                    opt.error(data);
                }
            });
        }
    };

    var Tmpl = function(tmpl, data, tool){
        return {
            appendTo: function(container){
                $(container).append(tmpl);
            }
        };
    };

    var newObject = function(func){
        var obj = {};
        func(obj);

        obj.__proto__ = func.prototype;

        return obj;
    };

    /**
     * 根据cgi和参数生成对应的localStorge
     * 要去除类似随机数的参数
     */
    var getKey = function(cgiName, param){
        var o = {};

        for(var i in param){
            if(i === "from" || i === "sid" || i === "bkn"){
                continue;
            }

            o[i] = param[i];
        }

        var key = cgiName + "_" + JSON.stringify(o);

        return key;
    };

    var emptyFunc = function(){};

    // 逐步代替scrollHandle
    // scrollHelper复制一份 便于model控制
    var preScrollTop = 0;
    var scrollHandlerMap = {
    };
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

        removeModel: function(model){
            var scrollEl = model._scrollEl;
            var el = scrollEl;
            if(typeof scrollEl == "string"){
                el = $(scrollEl);
            }

            if(el.attr("id")){
                var id = el.attr("id");

                delete scrollHandlerMap[id];
            }
        },

        addModel: function(model){
            var scrollEl = model._scrollEl;
            var el = scrollEl;
            if(typeof scrollEl == "string"){
                el = $(scrollEl);
            }

            var id;
            if(el == window){
                id = '__window__';
            }else{

                id = el.attr("id");
                if(id){
                }else{
                    id = "d_" + ~~ (100000 * Math.random());
                    el.attr("id", id);
                }
            }

            if(scrollHandlerMap[id]){
                scrollHandlerMap[id].push(model);
            }else{
                scrollHandlerMap[id] = [model];
                this.init({
                    container: el,
                    scrollToHalfCallback: function(){

                        scrollHandlerMap[id].map(function(item){
                           if(! item.canScrollInMTB){
                               return;
                           }
                           if(item.type == "scrollModel"){
                                if(! item.freezed && item.scrollEnable){
                                    item.rock();
                                }
                            }else{

                                if(! item.freezed && item.currModel.type == "scrollModel" && !item.currModel.freezed && item.currModel.scrollEnable){

                                    item.currModel.rock();
                                }
                            }
                        });
                    }
                });
            }

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
    var _containerCountInfo = {};
    /**
     * 普通的页面渲染模型
     */
    var renderModel = function(opt){
        // 使用空func便于后续支持更便捷的对象继承方式
        // 比如 var a = new RenderModel({});
        //      var b = new a(); // b继承自a
        var func = function(o){
        };
        func.renderTmpl = opt.tmpl; //渲染的模板
        func.cgiName = opt.url; //请求的cgi
        func.wrapper = opt.wrapper; //要渲染到的dom元素，支持selector和元素
        func.param = opt.param; //请求的参数，可以是对象 或者 function
        func.beforeRequest = opt.beforeRequest  || function(){};
        func.processData = opt.processData; //对数据进行的加工处理 这时不允许对view层做修改
        func.data = opt.data; //如果存在data就会直接用data的数据而不用去请求cgi
        func.renderTool = opt.tool; //渲染模板的时候可以传入一个工具函数对象，在view层使用
        func.onreset = opt.onreset; //模型被重置时候做的处理
        func.events = opt.events; //模型注册的事件
        func.complete = opt.complete; //模型完成渲染后进行的操作，这时候可以进行view层的修改
        func.myData = opt.myData; //自定义数据
        func.error = opt.error; //cgi出错时候的处理
        func.noRefresh = opt.noRefresh || 0; //是不是自己提供refresh方法
        func.scrollEl = opt.scrollEl || null;

        func.paramCache = []; //参数的请求缓存
        func.cgiCount = 0; //cgi的请求次数
        func.dataCache = []; //cgi回来的data缓存

        func.feedPool = []; //需要喂养数据的模型池
        func.isFirstRender = 1; //标记是不是第一次渲染模型
        func.eventsBinded = 0; //标记事件是不是被注册绑定过了

        func.isFirstDataRequestRender = 0; //标记是不是第一次发cgi请求进行渲染

        //是否使用预加载模式
        func.usePreLoad = opt.usePreLoad;

        func.__proto__ = renderModel.prototype; //不解释

        func.prototype = func; //不解释

        if(opt.wrapper){
            /*
            if(typeof opt.wrapper !== "string"){
            }
            */

            if(_containerCountInfo[opt.wrapper]){
                _containerCountInfo[opt.wrapper] ++;
            }else{
                _containerCountInfo[opt.wrapper] = 1;
            }
        }

        return func;
    };

    /**
     * 普通渲染模型的原型链
     */
    renderModel.prototype = {
        // 类型
        type: "renderModel",

        // 外放tab
        exportTab: function(selector){
            var key = "recieveModel" + selector;
            if(window[key] && typeof window[key] === "function"){
                window[key](selector, this);
            }
        },

        // cgi取数据
        getData: function(callback){
            var _this = this;

            // 如果之前有发过请求，则使用缓存的参数池中对应的参数，否则使用param方法构造参数
            var param = _this.paramCache[_this.cgiCount] || (typeof this.param == "object" && this.param) || (typeof this.param === "function" && this.param.call(this)) || {};

            var opt = {
                url: this.cgiName,
                param: param,
                succ: function(res, isLocalRender){
                   
                    // isLocalRender标记是从localStroage中取到的数据 直接执行回调
                    if(isLocalRender){
                        callback(res);
                        return;
                    }
                    
                    // 更新此次的缓存cgi数据和请求参数数据
                    _this.dataCache[_this.cgiCount] = res;
                    _this.paramCache[_this.cgiCount] = param;

                    // cgi请求参数自增
                    _this.cgiCount ++;

                    // 如果是第一次从cgi请求的数据 则缓存数据到localStrage里面
                    if(_this.cgiCount == 1){
                        var key = getKey(_this.cgiName, param);

                        try{
                            window.localStorage.setItem(key, JSON.stringify(res));
                        }catch(e){
                            window.localStorage.clear();
                            window.localStorage.setItem(key, JSON.stringify(res));
                        }
                    }


                    //执行回调
                    callback(res);


                },

                err: function(res){
                    _this.paramCache[_this.cgiCount] = param;
                    _this.cgiCount ++;

                    _this.error && _this.error(res, _this.cgiCount);
                }
            };


            //使用预加载数据相关逻辑
            if(this.usePreLoad && this.preLoadData){

                //取消预加载模式，方面model后面可以继续使用常规的加载模式
                this.usePreLoad = false;       

                //非正常预加载数据，走原有逻辑发cgi重试
                if(this.preLoadData.type != 'error' && this.preLoadData.retcode == 0){
                    //预加载数据模式的数据保存与渲染
                    opt.succ(this.preLoadData);
                    return;
                } 
                // else{
                    // 出错的话重新先走缓存，再走cgi拉的原有逻辑
                    // this.cgiCount = 0;
                    // this.isFirstRender = 1;
                // }
            }


            //如果是第一次渲染，且cgi也还没有发送请求 那么 使用缓存中数据
            if(_this.cgiCount == 0 && _this.isFirstRender){
                var localData;

                var key = getKey(this.cgiName, param);
                localData = JSON.parse(window.localStorage.getItem(key) || "{}");;

                if(localData.result){
                    try{
                        opt.succ(localData, 1);
                    }catch(e){
                    }
                }

                _this.isFirstRender = 0;

            }

            // 如果缓存中有数据 使用缓存数据 否则发送请求
            if(this.dataCache[_this.cgiCount]){
                opt.succ(this.dataCache[_this.cgiCount]);
            }
            //使用预加载数据模式的话，没有缓存也不发请求了，静待预加载数据返回即可
            else if(!this.usePreLoad){
                DB.cgiHttp(opt);
            }
            else{
                _this.paramCache[_this.cgiCount] = param;
            }
        },
        clearLocalData:function(cgiCount){
            var param = this.paramCache[cgiCount || 0];
            var key = getKey(this.cgiName, param);
            window.localStorage.removeItem(key);
        },
        //设置预加载数据
        setPreLoadData:function(res){
            this.preLoadData = res;
        },
        /**
         * 模型重置
         * 清空container, 并且用缓存数据重新渲染(如果有缓存数据，没有则继续发布请求)
         */
        reset: function(){
            /*
            var container = this.wrapper;
            if(typeof container == "string"){
                container = $(container);
            }
            container.html("");
            */

            this.cgiCount = 0;
            this.melt();

            this.onreset && this.onreset();
        },

        render: function(container, isReplace){
            var _this = this;
            this.scrollEnable = 0;
            if(typeof container === "string"){
                container = $(container);
            }
            this.beforeRequest && this.beforeRequest();

            if(this.cgiName){
                this.getData(function(data){

                    if(_this.cgiCount == 1) {
                        _this.onreset && _this.onreset();
                        container.html("");
                    }

                    _this.processData && _this.processData.call(_this, data, _this.cgiCount);

                    Tmpl(_this.renderTmpl, data.result || data, _this.renderTool || {}).appendTo(container);

                    _this.scrollEnable = 1;

                    if(_this.eventsBinded){
                    }else{
                        _this.events && _this.events();

                        if(_this.hasOwnProperty("eventsBinded")){
                            _this.eventsBinded = 1;
                        }else{
                            _this.__proto__.eventsBinded = 1;
                        }
                    }

                    _this.feedPool.map(function(item){
                        if (!item.noFeed) {
                            item.setFeedData(data, _this.cgiCount);
                            item.rock();
                        }
                    });

                    _this.complete && _this.complete(data, _this.cgiCount);

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
                        
                        if(_this.hasOwnProperty("eventsBinded")){
                            _this.eventsBinded = 1;
                        }else{
                            _this.__proto__.eventsBinded = 1;
                        }

                    }

                    _this.scrollEnable = 1;

                    _this.feedPool.map(function(item){
                        if (!item.noFeed) {
                            item.setFeedData(this.data, _this.cgiCount);

                            item.rock();
                        }
                    });

                    _this.complete && _this.complete(this.data, _this.cgiCount);

                    _this.isFirstDataRequestRender ++;
                }
            }
        },

        /**
         * rock 
         */
        rock: function(){
            this.render(this.wrapper, 1);
        },

        processData: function(data){
        },

        //用自己辛苦拿到的数据哺乳另一个模型
        feed: function(model){
            this.feedPool.push(model);
            model.feeded = 1;
        },

        setFeedData: function(data, cgiCount){
            this.data = data;
            this.cgiCount = cgiCount;
        },

        /**
         * 用新的数据对更新模型
         */
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

        /**
         * 重新请求cgi刷新模型
         */
        refresh: function(){
            if(this.noRefresh){
            }else{
                this.dataCache = [];
                this.reset();
                this.rock();
            }
        },

        /**
         * 隐藏模型
         */
        hide: function(){
            var container = this.wrapper;
            if(typeof container === "string"){
                container = $(container);
            }

            container.hide();
        },

        /**
         * 显示模型
         */
        show: function(){
            var container = this.wrapper;
            if(typeof container === "string"){
                container = $(container);
            }

            container.show();
        },

        /**
         * 继承模型
         */
        extend: function(opt){
            var func = function(){
            };

            var events = opt.events;

            func.prototype = this;//object;

            var clone = new func();

            clone.feedPool = [];
            clone.cgiCount = 0;
            clone.dataCache = [];
            clone.isFirstDataRequestRender = 0;
            clone.isFirstRender = 1;
            clone._addedToModel = 0;

            //如果重新定义了param 不使用缓存
            if(opt.param){
                clone.paramCache = [];
            }

            for(var i in opt){
                clone[i] = opt[i];
            }

            //如果定义了事件 就不使用原来的事件
            if(events){
                clone.events = function(){
                    events && events.call(this);
                };

                clone.eventsBinded = 0;
            }

            if(clone.wrapper){
                
                if(_containerCountInfo[clone.wrapper]){
                    _containerCountInfo[clone.wrapper] ++;
                }else{
                    _containerCountInfo[clone.wrapper] = 1;
                }
            }


            return clone;
        },

        freeze: function(){
            this.freezed = 1;
        },

        melt: function(){
            this.freezed = 0;
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
       Render._scrollEl = opt.scrollEl || opt.wrapper || ($.os.ios ? "#js_bar_main" : window);

       Render._ctlByMutitab = 0;

       var events = Render.events;

       Render.events = function(){
            events && events.call(this);
       };

       Render.renderContent = function(){
           this.render(this.wrapper, 1);
       };


       Render._addedToModel = 0;

       Render.rock = function(){
             this.render(this.wrapper, 1);

             if(! this._addedToModel){
                ScrollHelper.addModel(this);

                this._addedToModel = 1;
             }
       };


       return Render;
    };

    // 虚模型 待实现模型
    // @todo 进一步封装
    var abstractModel = function () {

    };

    abstractModel.prototype = {
        type: "abstractModel",
        rock: function(){

        },
        reset: function () {

        },

        refresh: function () {

        },
        freeze: function () {

        },
        resetData: function(){

        }
    };

    var cgiModel = function(opt){
        this.cgiName = opt.cgiName;
        this.param = opt.param;
        this.processData = opt.processData;
        this.complete = opt.complete;
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
            var _this = this;

            this.getData(function(data){
                _this.processData && _this.processData(data, _this.cgiCount);
                _this.complete && _this.complete(data, _this.cgiCount);
            });
        },

        reset: function(){
            this.dataCache = [];
        },

        refresh: function(){
            this.dataCache = [];
            this.rock();
        },

        extend: renderModel.prototype.extend
    };

    var handlers = {
        onScrollEnd: function(){},
        onScrollToBottom: function(){},
        onScrollToHalf: function(){

            scrollHanderPool.map(function(item, index){
                if(! item.canScrollInMTB){
                    return;
                }
         
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



    /**
     * 多tab切换管理模型
     */
    var mutitabModel = function(){
        this.pool = [];

        this.currModel = null;

        this.eventBinded = 0;
    };


    mutitabModel.prototype = {
        _bindSwitchEvent: function(){
            var _this = this;


            if(! this.eventBinded){
                $("body").on("tap", function(e){
                    var target = $(e.target);
                    var containerCountInfo = _containerCountInfo;

                    var currentModel = [];
                    var indexArr = []
                    for(var i = 0; i < _this.pool.length; i ++){
                        var selector = _this.pool[i][0];

                        var hittedEl = target.closest(selector);
                        if(hittedEl && hittedEl.length){
                            currentModel.push(_this.pool[i]);
                            indexArr.push(i);
                        }
 
                    }

                    if(currentModel.length){
                        var item = currentModel[0];
                        var selector = item[0];
                        var smodel = item[1];

                        if(typeof smodel === "string"){
                            var key = "recieveModel" + selector;
                            window[key] = function(selector, model){
                                if(selector && model){
                                    _this.pool[indexArr[0]] = [selector, model];

                                    window[key] = null;
                                    delete window[key];

                                    _this.rock(selector);
                                }
                            };

                            loadjs.loadModule(smodel);

                            return;
                        }

                        _this.currModel = smodel;

                        smodel.canScrollInMTB = 1;


                        _this.beforeTabHandler && _this.beforeTabHandler.call(_this, selector, 'switch')

                        // render container为空的情况
                        if(! smodel.wrapper){
                            if(smodel.type === "pageModel"){
                                _this.currModel._switchedToPage();
                            }
                        }else{

                            if(containerCountInfo[smodel.wrapper] > 1){
                                _this.currModel.reset();
                                _this.currModel.rock();

                            }else{
                                if(smodel.isFirstDataRequestRender > 0){
                                }else{
                                    smodel.rock();
                                }
                            }
                        }

                        if(_this.currModel.type == "linkModel") {
                            _this.tabHander && _this.tabHander.call(_this, selector, 'switch');
                            return;
                        }

                        _this.pool.map(function(item){
                            var s = item[0];

                            if(item[1] !== smodel){
                                if(typeof item[1] !== "string"){
                                    item[1].hide();
                                    item[1].canScrollInMTB = 0;

                                    $(s).removeClass('active')
                                       .removeClass('selected');

                                }
                            }
                        });

                        $(selector).addClass('active')
                            .addClass('selected');
                        smodel.show();


                        _this.tabHander && _this.tabHander.call(_this, selector, 'switch');
                    }
                });

                this.eventBinded = 1;
            }else{
            }

        },

        rock: function(_selector){
            var _this = this;

            var initedSmodelInfo;

            var containerCountInfo = _containerCountInfo;    
            for(var index = 0; index < this.pool.length; index ++){
                var item = this.pool[index];
                var selector = item[0];
                var smodel = item[1];

                if(this.initTab){
                    if(selector === this.initTab){
                        initedSmodelInfo = [selector, smodel, index];
                    }
                }else{
                    if(_selector){
                        if(_selector === selector) {
                            initedSmodelInfo = [selector, smodel, index];
                        }
                    }else{
                        if(index === 0){
                            initedSmodelInfo = [selector, smodel, index];
                        }
                    }
                }

            }

           if(! initedSmodelInfo){
                console.info("Model cannot init mutitab, check if selector exists!");
                return;
            }

            this._bindSwitchEvent();

            var selector = initedSmodelInfo[0];
            var smodel = initedSmodelInfo[1];
            var index = initedSmodelInfo[2];

            if(typeof smodel === "string"){
                var key = "recieveModel" + selector;
                window[key] = function(selector, model){
                    if(selector && model){
                        _this.pool[index] = [selector, model];

                        window[key] = null;
                        delete window[key];

                        model.scrollEnable = 0;

                        _this.rock(selector);
                    }
                };

                loadjs.loadModule(smodel);

                return;
            }

            this.beforeTabHandler && this.beforeTabHandler.call(this, selector, 'switch')

            smodel.canScrollInMTB = 1;

            this.currModel = smodel;
            this.currModel.reset();
            this.currModel.rock();


            this.pool.map(function(item){
                var m = item[1];
                if(m !== smodel){
                    if(typeof m === "string"){
                    }else{
                        $(item[0]).removeClass('active')
                                   .removeClass('selected');
                        m.hide();
                        m.canScrollInMTB = 0;
                    }
                }
            });

            $(selector).addClass('active')
                   .addClass('selected');
            
            this.currModel.show();

            this.scrollEnable = this.currModel.scrollEnable;

            this.tabHander && this.tabHander.call(this, selector, 'init');
        },

        add: function(selector, smodel){
            smodel._modelSelector = selector;
            this.pool.push([selector, smodel]);

            smodel.controller = this;

            if(typeof smodel === "string"){
                if(window.loadJsConfig && window.loadJsConfig.modules){
                    if(! window.loadJsConfig.modules[smodel]){
                        console.info("mutitab connot load lazymodel while " + smodel + " not exists in loadJsConfig modules!");
                    }
                }
            }else{
                smodel.scrollEnable = 0;
            }


        },

        beforetabswitch: function(func){
            this.beforeTabHandler = func;
        },
        ontabswitch: function(func){
            this.tabHander = func;
        },

        switchTo: function(selector){
            if($(selector)[0]){
                $(selector).trigger("tap");
                
            }else{
                 var el;
                 if(/^#/.test(selector)){
                     el = $("<div style='display: none;' id='" + selector.replace("#", "") + "'></div>");
                 }else{
                     el = $("<div style='display: none;' class='" + selector.replace(".", "") + "'></div>");
                 }

                 $("body").append(el);

                 el.trigger("tap");
            }
        },

        init: function(tabSelector){
            this.initTab = tabSelector;
        },

        freeze: function(){
            this.freezed = 1;
        },
        melt: function () {
            this.freezed  = 0;
        },

        //冻结当前模型
        freezeCurrent: function(){
            this.currModel.freeze();
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

    /*
    var findAnsestor = function(c1, c2){
    };
    */

    var pageModel = function(opt){
        if(opt && opt.wrapper){
            this.wrapper = opt.wrapper;
        }

        this.models = [];
    };


    pageModel.prototype = {
        set canScrollInMTB(value){
            this.models.map(function(item){
                item.canScrollInMTB = value;
            });
        },
        type: "pageModel",
        exportTab: renderModel.prototype.exportTab,
        //增加一个渲染模型，大致按cgi去划分
        add: function(model){
            this.models.push(model);
            model.controller = this;

            /*
            if(! this._userSetContainer){
                var container = this.wrapper;
                var container2;

                if(typeof container === "string"){
                    container = $(container);
                }

                if(typeof model.container === "string"){
                    container2 = $(model.wrapper);
                }

                this.findAnsestor(container, container2);
            }
            */
        },

        remove: function(model){
            var index;
            this.models.map(function(item, i){
                if(item == model){
                    index = i;

                    model.controller = null;
                }
            });

            if(index){
                this.models.splice(index, 1);
            }
        },

        _switchedToPage: function(){
            this.models.map(function(item){
                if(item.type === "page"){
                    item._switchedToPage();
                }else{
                    // 有container render scroll
                    if(item.wrapper){
                        if(_containerCountInfo[item.wrapper] > 1){
                            item.reset();
                            item.rock();
                        }else{
                            if(item.isFirstDataRequestRender > 0){
                            }else{
                                item.rock();
                            }
                        }
                    // 无 mutitab及其他
                    }else{
                        //item.rock();
                    }
                }
            });
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

        refresh: function(){
             this.models.map(function(item){
                item.refresh();
            });
        },

        hide: function(){
            if(this.wrapper){
                $(this.wrapper).hide();
            }else{
                this.models.map(function(item){
                    item.hide();
                });
            }
        },

        show: function(){
            if(this.wrapper){
                $(this.wrapper).show();
            }else{
                this.models.map(function(item){
                    item.show();
                });
            }
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
        type: "linkModel",
        hide: emptyFunc,
        show: emptyFunc,
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

    window.renderModel = renderModel;
    window.scrollModel = scrollModel;
    window.linkModel = linkModel;
    window.mutitabModel = mutitabModel;
    window.pageModel = pageModel;
    window.cgiModel = cgiModel;
    window.abstractModel = abstractModel;

    window.ScrollHelper = scrollHelper;

})();
