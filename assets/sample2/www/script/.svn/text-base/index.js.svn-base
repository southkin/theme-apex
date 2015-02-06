var navigationController;
function navi_back(){
	if (!navigationController.hasBack()) {
		alert('첫 페이지 입니다.');
		return;
	}
	navigationController.back(1);
}
function push_navi(url){
	// var element = $("<div>",{style:"width:100%;height:100%"});
	// var binder = new HtmlBinder(element);
	// binder.load(url,null,function(e){
	// 	setTimeout(function(){
	// 		alert('에러');
	// 		navigationController.back();
	// 	},500);
	// });
	// navigationController.push(element);
	navigationController.pushWithURL(url);
}
$(function(){
	navigationController = new Navigator($("#contentsWrap"));
	push_navi("pages/list.html");
});