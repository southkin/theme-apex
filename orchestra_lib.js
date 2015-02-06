var touch = "ontouchend" in document;
var pressEvent = (touch) ? 'touchend' : 'click';

var WEB_ROOT;
try {
	WEB_ROOT = location.href.match(/(http:|https:)/) ? "/" : /[^]+\/www\//.exec(location.href)[0];
}
catch(e) {
	WEB_ROOT = "./";
}

function cssLoad(path) {
	var css = $("<link>",{
		rel:"stylesheet",
		type:"text/css",
		href:WEB_ROOT+path
	});
	$("head").append(css);
}
function scrollRefresh() {
	$(".scroller").trigger("scrollRefresh");
}

var HtmlBinder = function(element) {
	this.init(element);
};
HtmlBinder.prototype.nowScrolling = false;
HtmlBinder.prototype.init = function(element){
	this.targetElement = $(element);
	$(element).html("");
	var container = $("<div>",{"class":"HtmlBinder"});
	var scrollElement = $("<div>",{"class":"scroller"});
	$(container).append(scrollElement);
	$(element).append(container);
	$(element).append($("<div>",{"class":"loadingDiv"}));
	var _this = this;
	this.scroller = new IScroll(container.get(0), {
		mouseWheel: true
    });
	$(scrollElement).bind("scrollRefresh",function(){
		_this.scroller.refresh();
	});
};
HtmlBinder.prototype.load = function(url,success,error){
	success = success || function(){};
	error = error || function(e){console.log(e);};
	var startDate;
	var wrap = $(this.warp);
	var element = $(this.targetElement);
	var scroller = this.scroller;
	var bind = function(html) {
		var endDate = new Date();
		var _fnc = function(){
			try {
				if (html) {
	                element.find(".scroller").html("");
					element.find(".scroller").html(html);
				    var fsEle = element.find(".binder_FullSize");
				    fsEle.height(element.height());
				    fsEle.width(element.width());
				    scroller.refresh();
					scroller.scrollTo(0,0,0);
					setTimeout(function(){
						scroller.refresh();
					},200);
				}
				element.removeClass("loading");
				success();
			}
			catch(e) {
				error(e);
			}
		};
		if ($(element).hasClass("HtmlBinder_Animation")) {
			setTimeout(_fnc,
				500-(endDate - startDate) // css 애니메이션 시간과 동일하게 세팅해야 함
				);

		}
		else {
			setTimeout(_fnc,0-(endDate - startDate));
		}
	};
	var request = $.ajax({
		beforeSend:function(){
			startDate = new Date();
			element.addClass("loading");
		},
		success:function(html){
			var body = /<body[^>]*>([^]*)<\/body>/g.exec(html) || ["",html];
			bind(body[1]);
		},
		error:function(e){
			error(e);
		},
		url: url,
		data:{}
	});
};
var Navigator = function(targetElement) {
	var _navigator = this;
	this.targetElement = $(targetElement);
	$(targetElement).addClass("Navigator");
	this.init();
};
Navigator.prototype.init = function() {
	$(this.targetElement).html("");
	$(this.targetElement).prepend($("<div>"));
};
Navigator.prototype.count = function() {
	return $(this.targetElement).children().length-1;
};
Navigator.prototype.push = function(element,description) {
	var target = this.targetElement;
	var firstElement = target.children()[0];
	$(firstElement).html(element);
	$(firstElement).attr("description",description);
	var isInit = target.children().length == 1;
	if (isInit) {
		$(target).addClass("noAnimation");
	}
	$(target).prepend($("<div>"));

	if (isInit) {
		setTimeout(function(){
			$(target).removeClass("noAnimation");
		},0);
	}
};
Navigator.prototype.pushWithURL = function(url) {
	var element = $("<div>",{
		style:"width:100%;height:100%;position:relative;"
	});
	var binder = new HtmlBinder(element);
	var _this = this;
	binder.load(url,null,function(e){
		setTimeout(function(){
			alert('페이지를 불러올 수 없습니다.');
			_this.back();
		},300);
	});
	this.push(element,url);
};
Navigator.prototype.getCurrentDescription = function() {
	var element = $(this.targetElement).children()[1];
	return $(element).attr("description");
};
Navigator.prototype.hasBack = function() {
	return $(this.targetElement).children().length > 2;
};
Navigator.prototype._back = function() {
	if (this.hasBack()) {
		var currentItem = $(this.targetElement).children()[0];
		$(currentItem).remove();
	}
};
Navigator.prototype.back = function(cnt) {
	var _cnt = cnt || 1;
	if (this.count() < cnt) {
		_cnt = this.count();
	}
	var target = this.targetElement;
	$(target).addClass("noAnimation");
	for (var i = 1 ; i < _cnt ; i++) {
		this._back();
	}
	var _this = this;
	$(target).removeClass("noAnimation");
	setTimeout(function(){
		_this._back();
	},0);
};
Navigator.prototype.goTo = function(idx) {
	var target = this.targetElement;
	$(target).addClass("noAnimation");
	var cnt = $(target).children().length - idx;
	while($(target).children().length > idx+1) {
		this.back();
	}
	if ($(target).children().length > idx) {
		var _this = this;
		$(target).removeClass("noAnimation");
		setTimeout(function(){
			_this._back();
		},0);
	}
};

var NotificationCenter = {
	listenerList:{},
	getList:function(notiName){
		var _list = NotificationCenter.listenerList[notiName];
		if (!_list) {
			_list = [];
			NotificationCenter.listenerList[notiName] = _list;
		}
		return _list;
	},
	removeListener:function(notiName,notiId){
		var _list = NotificationCenter.getList(notiName);
		for (var i in _list) {
			var _fnc = _list[i];
			if (_fnc.id == notiId) {
				delete _list[i];
				return;
			}
		}
	},
	addListener:function(notiName,notiId,fnc){
		NotificationCenter.removeListener(notiName,notiId);
		NotificationCenter.getList(notiName).push({fnc:fnc,id:notiId});
	},
	post:function(notiName,userInfo) {
		var _list = NotificationCenter.getList(notiName);
		for (var i in _list) {
			var _fnc = _list[i].fnc;
			_fnc(userInfo);
		}
	}
};

var POPUP = {
	_popupContainerDiv:$("<div>",{class:"__popup_container"}),
	_contents:function(){
		return $(".__popup_container > .popup_contents");
	},
	_showing:false,
	queue:[],
	show:function(element){
		POPUP.queue.push(element);
		POPUP._show();
	},
	showWithURL:function(url,size) {
		size = size || {width:100,height:100};
		var element = $("<div>",{
			style:"position:relative;"
		});
		element.width(size.width);
		element.height(size.height);
		var binder = new HtmlBinder(element);
		var _this = this;
		binder.load(url,null,function(e){
			setTimeout(function(){
				alert('페이지를 불러올 수 없습니다.');
				POPUP.close();
			},200);
		});
		POPUP.show(element);
	},
	_show:function(){
		if (POPUP._showing) {
			return;
		}
		var item = POPUP.queue.shift();
		if (!item) {
			return;
		}
		var marginLeft = -$(item).width()*0.5;
		var marginTop = -$(item).height()*0.5;
		$(item).css({
			position:"absolute",
			top:"50%",
			left:"50%",
			"margin-left":marginLeft,
			"margin-top":marginTop
		});
		$(POPUP._contents()).append(item);
		POPUP._showing = true;
		setTimeout(function(){
			$(POPUP._popupContainerDiv).addClass("show");
		},0);
	},
	close:function(){
		$(POPUP._popupContainerDiv).removeClass("show");
		setTimeout(function(){
			$(POPUP._contents()).html("");
			POPUP._showing = false;
			POPUP._show();
		},200);
	}
};
$(function(){
	POPUP._popupContainerDiv.append($("<div>",{class:"bg"}));
	POPUP._popupContainerDiv.append($("<div>",{class:"popup_contents"}));
	$("body").append(POPUP._popupContainerDiv);
	$(".__popup_container > .bg").click(function(e){
		POPUP.close();
	});

	var touchObj;
	var touchbusy = false;
	if ("ontouchend" in document) {
		$("body").bind("touchstart",function(e){
			if (touchbusy) {
				return;
			}
			touchObj = e.target;
		});
		$("body").bind("touchmove",function(e){
			touchObj = null;
		});
		$("body").bind("touchend",function(e){
			console.log(e.target);
			if (touchObj == e.target) {
				$(e.target).trigger("click");
				e.preventDefault();	
				touchbusy = true;
				touchObj = null;
				setTimeout(function(){
					touchbusy = false;
				},300);
			}
		});
	}
});