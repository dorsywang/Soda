   var newObject = function(func){
        var obj = {};
        func(obj);

        obj.__proto__ = func.prototype;

        return obj;
   };

   var renderModel = function(opt){
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

    func.paramCache = [];
    func.cgiCount = 0;

    func.feedPool = [];

    func.__proto__ = renderModel.prototype;

    func.prototype = func;

    return func;
};

renderModel.prototype = {
    getData: function(callback){
        var _this = this;

        var param = _this.paramCache[_this.cgiCount] || this.param();

        var opt = {
            url: this.cgiName,
            param: param,
            succ: function(res){
                _this.paramCache[_this.cgiCount] = param;
                _this.cgiCount ++;
                callback(res);
            },

            err: function(){
                _this.paramCache[_this.cgiCount] = param;
                _this.cgiCount ++;
            }
        };
        DB.cgiHttp(opt);
    },

    reset: function(){
        var container = this.renderContainer;
        if(typeof container == "string"){
            container = $(container);
        }
        container.html("");

        this.cgiCount = 0;

        this.onreset && this.onreset()
    },

    render: function(container, isReplace){
        var _this = this;
        this.scrollEnable = 0;
        if(typeof container === "string"){
            container = $(container);
        }

        if(this.cgiName){
            this.getData(function(data){
                _this.processData(data);

                Tmpl(_this.renderTmpl, data.result || data, _this.renderTool || {}).appendTo(container);

                _this.scrollEnable = 1;

                _this.events && _this.events();

                _this.feedPool.map(function(item){
                    item.setFeedData(data);

                    item.rock();
                });

                _this.complete && _this.complete(data);

            });
        }else{
            if(this.data){
                _this.processData && _this.processData(this.data);
                
                Tmpl(_this.renderTmpl, this.data.result || this.data, _this.renderTool).appendTo(container);
                _this.events && _this.events();

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
    }
};

var scrollHanderPool = [];

var scrollArea = ($.os.ios > 5) ? '#js_bar_main' : window;

var scrollModel = function(opt){
   var Render = new renderModel(opt);
   Render.scrollEnable = 1;


   return Render;
};

var handlers = {
    onScrollEnd: function(){},
    onScrollToBottom: function(){},
    onScrollToHalf: function(){
        scrollHanderPool.map(function(item, index){
            if(! item.freezed && item.currModel.scrollEnable){
                item.currModel.rock();
            }
        });
    }
};

ScrollHandle.init({
    container: scrollArea,
    scollEndCallback: handlers.onScrollEnd,
    scrollToBottomCallback: handlers.onScrollToBottom,
    scrollToHalfCallback: handlers.onScrollToHalf
});


ScrollHandle.addModel = function(model){
    scrollHanderPool.push(model);
};

ScrollHandle.removeModel = function(model){
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

        ScrollHandle.addModel(this);

        this.pool.map(function(item, index){
            var selector = item[0];
            var smodel = item[1];

            $("body").on('tap', selector, function(){
                _this.currModel = smodel;
                _this.currModel.reset();
                _this.currModel.rock();

                _this.pool.map(function(item){
                    var s = item[0];

                    $(s).removeClass('active');
                });

                $(selector).addClass('active');

                _this.tabHander && _this.tabHander(selector);
            });


            if(_this.initTab){
                if(selector == _this.initTab){
                    _this.currModel = smodel;
                    _this.currModel.reset();
                    _this.currModel.rock();

                    $(selector).addClass('active');
                    _this.scrollEnable = _this.currModel.scrollEnable;

                    _this.tabHander && _this.tabHander(selector);
                }
            }else{

                if(index == 0){
                    _this.currModel = smodel;
                    _this.currModel.reset();
                    _this.currModel.rock();

                    $(selector).addClass('active');
                    _this.scrollEnable = _this.currModel.scrollEnable;

                    _this.tabHander && _this.tabHander(selector);
                }
            }

        });
    },

    add: function(selector, smodel){
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

};

linkModel.prototype = {
    rock: function(){
        var query = "";
        var param = this.param;
        if(typeof this.param == "function"){
            param = this.param();
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
}
