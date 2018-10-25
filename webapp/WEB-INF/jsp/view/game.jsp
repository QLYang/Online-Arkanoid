<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%--@elvariable id="action" type="java.lang.String"--%>
<%--@elvariable id="gameId" type="long"--%>
<%--@elvariable id="username" type="java.lang.String"--%>
<!DOCTYPE>
<html>
<head>
<style media="screen">
		canvas{
			border:1px black solid;
		}
	</style>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>game</title>
<link rel="stylesheet"
	href="http://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.1/css/bootstrap.min.css" />
<script src="http://code.jquery.com/jquery-1.9.1.js"></script>
<script
	src="http://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.1/js/bootstrap.min.js"></script>
</head>
<body>
	<div style="column-count:2;">
		<div><canvas id="playground1" width="400" height="400"></canvas></br>
			<span id="you">你</span><br/>
			<span id="status1">游戏开始</span><br/>
			<span id="score1">Score:0</span>
		</div>
		<div><canvas id="playground2" width="400" height="400"></canvas></br>
			<span id="opponent">对手：</span><br/>
			<span id="status2">游戏开始</span><br/>
			<span id="score2">分数:0</span>
		</div>
	</div>
	<%--提示窗口 --%>
	<div id="modalWaiting" class="modal hide fade">
		<div class="modal-header">
			<h3>等待玩家...</h3>
		</div>
		<div class="modal-body" id="modalWaitingBody">&nbsp;</div>
	</div>
	<div id="modalError" class="modal hide fade">
		<div class="modal-header">
			<button type="button" class="close" data-dismiss="modal">&times;
			</button>
			<h3>Error</h3>
		</div>
		<div class="modal-body" id="modalErrorBody">发生错误</div>
		<div class="modal-footer">
			<button class="btn btn-primary" data-dismiss="modal">OK</button>
		</div>
	</div>
	<div id="modalGameOver" class="modal hide fade">
		<div class="modal-header">
			<button type="button" class="close" data-dismiss="modal">&times;
			</button>
			<h3>游戏结束</h3>
		</div>
		
		<div class="modal-body" id="modalGameOverBody">&nbsp;</div>
		
		<div class="modal-footer">
			<button class="btn btn-primary" data-dismiss="modal">OK</button>
		</div>
	</div>
	<input type=hidden name=username id=username value='<c:out value="${username}" />'/>
	<input type=hidden name=gameId id=gameId value='<c:out value="${gameId}" />'/>
	<input type=hidden name=action id=action value='<c:out value="${action}" />'>
	<%--变量 --%>
	<input type=hidden name=meFirst id=meFirst value=false />
	<input type=hidden name=start id=start value=false />
	<%--坐标信息 --%>
	<input type=hidden name=ballX id=ballX value=0 />
	<input type=hidden name=ballY id=ballY value=0 />
	<input type=hidden name=paddleX id=paddleX value=0 />
	<input type=hidden name=paddleY id=paddleY value=0 />
	<input type=hidden name=score id=score value=0 />
	<input type=hidden name=status id=status value=2 />
	<input type=hidden name=index id=index value=0 />
	<%--是否收到数据 --%>
	<input type=hidden name=dataAccess id=dataAccess value=0 />
<script type="text/javascript" language="javascript" src="resource/game.js">

</script>
</body>
</html>