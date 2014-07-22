;
(function (root, factory) {
    root['ScrollHandle'] = factory(root['$']);
}(this, function () {

    var _scrollId;
    var delay = 300;
    var preScrollTop = 0;
    var eventPool = {};
    //滚动处理
    var ScrollHandle = {
        init:function(opt){

            var $container = $(opt.container);
            if(eventPool[$container[0]]){
                eventPool[$container[0]].push(opt);
            }else{
                eventPool[$container[0]] = [opt];
                $container.on('scroll', this.onScroll);
            }

        },
        //滚动事件
        onScroll:function(e){
            var container = e.target;
            var scrollTop,
                scrollHeight,
                windowHeight;

            //android 和 ios 5以下版本
            if(container === document){
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
                eventPool[container].map(function(item){
                    item.scrollToHalfCallback && item.scrollToHalfCallback(e);
                });
            }
            //滚动到底部
            else if(scrollTop + windowHeight >= scrollHeight){
                eventPool[container].map(function(item){
                    item.scrollToBottomCallback && item.scrollToBottomCallback(e);
                });
            }
            preScrollTop = scrollTop;

            clearTimeout(_scrollId);

            //滚动停止
            _scrollId = setTimeout(function(){
                eventPool[container].map(function(item){
                    item.scollEndCallback && item.scollEndCallback(e);
                });
            },delay);
        }
   };

   return ScrollHandle;

}));
