var topbaner = new renderModel({
    wrapper: "#list",
    tmpl: "template/list.html",
    tmpl_url: "",
    url: "data/data.json",
    data: {
    },
    param: {
    },
    processData: function(data){
    },
    complete: function(data){
    },
    error: function(data){
    }
});

var top2 = topbaner.extend({
    wrapper: "#list2"
});

var page = new pageModel();
page.add(topbaner);
page.add(top2);


var muti = new mutitabModel();
muti.add("fdsaf", page);

var page2 = new pageModel();
page2.add(muti);

page2.rock();

