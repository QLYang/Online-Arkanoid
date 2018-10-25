<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="UTF-8"%>
<%--@elvariable id="pendingGames" type="java.util.Map<long, java.Lang.String>"--%>
<!DOCTYPE html>
<html>
<head>
<title>game-list</title>
</head>
<body>
	<h1> 加入游戏</h1><br />
	<a href="javascript:void 0;" onclick="startGame();">创建游戏</a><br />
	<h1>现有游戏列表</h1><br />
	<c:choose>
            <c:when test="${fn:length(pendingGames) == 0}">
                <i>列表中没有游戏 </i>
            </c:when>
            <c:otherwise>
                当前游戏等待第二位玩家<br />
                <c:forEach items="${pendingGames}" var="e">
                    <a href="javascript:void 0;"
                       onclick="joinGame(${e.key});">用户: ${e.value}</a><br />
                </c:forEach>
            </c:otherwise>
    </c:choose>
    
    <script src="http://code.jquery.com/jquery-1.9.1.js"></script>
	<script type="text/javascript" language="javascript">
            var startGame, joinGame;
            $(document).ready(function() {
                var url = '<c:url value="/gameServlet" />';
                
                startGame = function() {
                    var username = 
                    	prompt('输入用户名创建游戏（仅限英文字母）', '');
                    if(username != null && username.trim().length > 0 &&
                            validateUsername(username))
                        post({action: 'start', username: username});
                };

                joinGame = function(gameId) {
                    var username =
                            prompt('输入用户名加入游戏（仅限英文字母）', '');
                    if(username != null && username.trim().length > 0 &&
                            validateUsername(username))
                        post({action: 'join', username: username, gameId: gameId});
                };

                var validateUsername = function(username) {
                    var valid = username.match(/^[a-zA-Z0-9_]+$/) != null;
                    if(!valid)
                        alert('User names can only contain letters, numbers ' +
                                'and underscores.');
                    return valid;
                };

                var post = function(fields) {
                    var form = $('<form id="mapForm" method="post"></form>')
                            .attr({ action: url, style: 'display: none;' });
                    for(var key in fields) {
                        if(fields.hasOwnProperty(key))
                            form.append($('<input type="hidden">').attr({
                                name: key, value: fields[key]
                            }));
                    }
                    $('body').append(form);
                    form.submit();
                };
            });
        </script>
</body>
</html>