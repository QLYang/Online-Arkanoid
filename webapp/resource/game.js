$(document).ready(function() {
var log=console.log.bind(console)

var getImage=function(path){
	var img=new Image()
	img.src=path
	return img 
}
var Paddle=function(){
	var o={
		img:getImage("resource/picture/paddle.jpg"),
		x:110,
		y:360,
		speed:10,
		visible:1,
	}
	o.moveLeft=function(){
		if (o.x>=o.speed) {
			o.x-=o.speed
		}	
	}
	o.moveRight=function(){
		if (o.x<=400-o.img.width-o.speed) {
			o.x+=o.speed
		}
	}
	o.collide_detect=function(ball){
		if ((ball.y<o.y)&&(ball.y+ball.img.height>=o.y)&&(ball.x+ball.img.width>=o.x)&&(ball.x<=o.x+o.img.width)) {
			ball.speedy=(-1)*ball.speedy
		}
	}
	return o
}
//msg(Unused)

var Ball=function(server){
	var o={
		img:getImage("resource/picture/ball.jpg"),
		x:100,
		y:320,
		speedx:10,
		speedy:10,
		fired:false,
		visible:1,
		server:server,//server where msg send to 
		execTimes:0,//执行次数
	}
	o.fire=function(){//不止执行一次.使用o.execTimes变量控制只执行一次
		if (meFirst.value=="true"&&o.execTimes==0&&start.value=="false"){
			o.fired=true
			//开球后，发消息通知对方
			o.sendGameStartMsgToServer(o.server)
			o.execTimes+=1
		}		
	}
	o.pause=function(){
		o.fired=false
	}
	o.move=function(){
		if (o.fired||start.value=="true") {
			if (o.x<0 || o.x+o.img.width>400) {
				o.speedx=(-1)*o.speedx
			}
			if (o.y<0) {
				o.speedy=(-1)*o.speedy
			}
			o.x+=o.speedx
			o.y+=o.speedy
		}
	}
	o.isOut=function(){
		if (o.y>400) {
			return true
		}
	}
	//按f开球后给服务器发消息
	o.sendGameStartMsgToServer=function(server){
	    if(server != null) {
	        server.send(JSON.stringify({
				type:1,//消息类型,start(1):发球后通知对手游戏开始
				ballX:0,
				ballY:0,
				paddleX:0,
				paddleY:0,
				score:0,
				status:2,
				indexOfBrick:-1,
	        }))
	   }
	}

	return o
}
var Brick=function(){
	var b={
		img:getImage("resource/picture/bricks1.jpg"),
		x:0,
		y:0,
		visible:1,
	}
	b.collide=function(ball){
		//from bottom
		if((ball.y<b.y+b.img.height)&&(ball.x+ball.img.width>b.x&&ball.x<b.x+b.img.width)){
			return true
		}
		//from top
		else if ((ball.y+ball.img.height>b.y)&&(ball.y+ball.img.height<b.y)&&(ball.x+ball.img.width>b.x&&ball.x<b.x+b.img.width)){
			return true
		}
	}
	return b
}
var Bricks_wall=function(x_num,y_num){
	var w={
		total:x_num*y_num,
		hit:0,
		l:[],//store bricks
	}
	w.push_array=function(obj){
		w.l.push(obj)
	}
	w.hit_all=function(){
		if (w.total==0) {
			return true
		}
	}
	w.collide_detect=function(ball){
		for (var i = w.l.length - 1; i >= 0; i--) {
			if (w.l[i].visible){
				if (w.l[i].collide(ball)){
					w.l[i].visible=0
					w.total-=1
					w.hit+=1
					ball.speedy=(-1)*ball.speedy
					return i
				}
			}	
		}
		return -1
	}
	var pos_x=0
	var pos_y=0
	
	var brickWidth=20
	var brickHeight=10

	for (var i = y_num- 1; i >= 0; i--) {
		for (var j = x_num - 1; j >= 0; j--) {
			var brick=Brick()
			brick.x=pos_x
			brick.y=pos_y
			w.push_array(brick)
			pos_x=pos_x+2+brickWidth
		}
		pos_x=0
		pos_y=pos_y+1+brickHeight		
	}
	return w
}

var Game=function(){
	//canvas
	var canvas=document.querySelector('#playground1')
	var context=canvas.getContext('2d')
	//status
	var spanStatus=document.querySelector('#status1')
	//score
	var spanScore=document.querySelector('#score1')

	var o={
		keydowns:{},
		actions:{},
		pics:[],
		canvas:canvas,
		context:context,
		status:spanStatus,
		score:spanScore,
	}
	//set events
	window.addEventListener('keydown',function(event){
		o.keydowns[event.key]=true
	})
	window.addEventListener("keyup",function(event){
		o.keydowns[event.key]=false
	})
	//register events and pics
	o.registerActions=function(key,callback){
		o.actions[key]=callback
	}
	o.registerPics=function(obj){
		o.pics.push(obj)
	}
	o.update=function(){
		//update	
	}
	o.draw=function(obj){
		//draw
		o.context.drawImage(obj.img,obj.x,obj.y)
	}
	o.drawAll=function(){
		o.context.clearRect(0,0,o.canvas.width,o.canvas.height)
		for (var i = o.pics.length - 1; i >= 0; i--) {
			if (o.pics[i].visible){//draw if visible
				o.draw(o.pics[i])
			}	
		}
	}
	o.gameIsOver=function(server,ball){
		if(ball.isOut()){
			o.drawAll()//最后一次刷新图像
			o.sendGameOverMessage(server,0)
			clearInterval(o.intervalId)
		}
	}
	o.gameWin=function(server,bricks){
		if(bricks.hit_all()){
			o.drawAll()
			o.sendGameOverMessage(server,1)
			clearInterval(o.intervalId)
		}
	}
	o.getScore=function(bricks_wall){
		var score=bricks_wall.hit*10
		o.score.textContent="分数:"+score
		return Number(o.score.textContent)+score
	}
	o.sendGameOverMessage=function(server,status){
		if(server != null) {
	        server.send(JSON.stringify({
				type:2,//消息类型,move(2):通知游戏结束
				ballX:0,
				ballY:0,
				paddleX:0,
				paddleY:0,
				score:0,
				status:status,
				indexOfBrick:-1,
	        }))
	   }
	}
	//timer
	o.intervalId=window.setInterval(function(){
		//events register
		var actions=Object.keys(o.actions)
		for (var i = actions.length - 1; i >= 0; i--) {
			var key=actions[i]
			if (o.keydowns[key]) {
				o.actions[key]()//exec callback
			}
		}
		//update
		o.update()
		//draw
		//o.drawAll()
	},1000/30)

	return o
}
var OpponentGame=function(){
	//canvas
	var canvas=document.querySelector('#playground2')
	var context=canvas.getContext('2d')
	//status
	var spanStatus2=document.querySelector('#status2')
	//score
	var spanScore2=document.querySelector('#score2')
	
	var o={
		pics:[],
		canvas:canvas,
		context:context,
		status:spanStatus2,
		score:spanScore2,
	}
	//register picture
	o.registerPics=function(obj){
		o.pics.push(obj)
	}
	//draw single image
	o.draw=function(obj){
		o.context.drawImage(obj.img,obj.x,obj.y)
	}
	//draw all image
	o.drawAll=function(){
		o.context.clearRect(0,0,o.canvas.width,o.canvas.height)
		for (var i = o.pics.length - 1; i >= 0; i--) {
			if (o.pics[i].visible){//draw if visible
				o.draw(o.pics[i])
			}	
		}
	}
	//score
	o.getScore=function(bricks_wall){
		var score=bricks_wall.hit*10
		o.score.textContent="分数："+score
	}
	return o
}
//main
var __main=function(server){
	//server
	var server=server
	//Game:Opponent
	var game=Game()
	var opponentGame=OpponentGame()
	
	var paddle=Paddle()
	var opponentPaddle=Paddle()
	
	var ball=Ball(server)
	var opponentBall=Ball()
	
	var bricks=Bricks_wall(18,10)
	var opponentBricks=Bricks_wall(18,10)
	
	//paddle
	game.registerActions("a",function(){paddle.moveLeft()})
	game.registerActions("d",function(){paddle.moveRight()})
	game.registerPics(paddle)
	
	opponentGame.registerPics(opponentPaddle)
	//ball
	game.registerActions("f",function(){ball.fire()})
	game.registerActions("p",function(){ball.pause()})
	game.registerPics(ball)
	
	opponentGame.registerPics(opponentBall)
	//bricks
	for (var i = bricks.l.length - 1; i >= 0; i--) {
		game.registerPics(bricks.l[i])
	}
	
	for(var i=opponentBricks.l.length-1;i>=0;i--){
		opponentGame.registerPics(opponentBricks.l[i])
	}
	//发送坐标
	var sendMoveMsgToServer=function(server,ballX,ballY,paddleX,paddleY,score,status,index){
		if(server != null) {
	        server.send(JSON.stringify({
				type:2,//消息类型,move(2):发送坐标给服务器
				ballX:ballX,
				ballY:ballY,
				paddleX:paddleX,
				paddleY:paddleY,
				score:score,
				status:status,
				indexOfBrick:index,
	        }))
	   }
	}
	//update
	game.update=function(){
		ball.move()
		//collide detect
		paddle.collide_detect(ball)
		var indexOfBrick=bricks.collide_detect(ball)//碰撞到的砖块编号（>=0）
		//刷新分数
		var meScore=game.getScore(bricks)
		var opponentScore=opponentGame.getScore(opponentBricks)
		//draw all
		game.drawAll()
		opponentGame.drawAll()
		//gameOver?
		game.gameIsOver(server,ball)
		game.gameWin(server,bricks)
		//msg.status==2
		var sendStatus=2
		//发送Move数据、解析服务器发来的数据(只有当球运动时)
		if(ball.fired==true||start.value=="true"){
			sendMoveMsgToServer(server,ball.x,ball.y,paddle.x,paddle.y,meScore,sendStatus,indexOfBrick)							
			if(dataAccess.value==1){
				//解析收到的数据
				opponentBall.x=ballX.value
				opponentBall.y=ballY.value
				opponentPaddle.x=paddleX.value
				opponentPaddle.y=paddleY.value
				opponentIndexOfBrick=index.value
				if(opponentIndexOfBrick!=-1){//如果击中方块，设该方块visibal==0
					opponentBricks.hit+=1
					opponentBricks.total-=1
					opponentBricks.l[opponentIndexOfBrick].visible=0
				}
				//如果获胜，终止游戏
				if(status.value==1){
					clearInterval(game.intervalId)
				}
			}
			dataAccess.value=0
		}
	}
}

	//服务器---------------------------------------------------
	
	
	var modalError = $("#modalError")
	var modalErrorBody = $("#modalErrorBody")
	var modalWaiting = $("#modalWaiting")
	var modalWaitingBody = $("#modalWaitingBody")
	var modalGameOver = $("#modalGameOver")
	var modalGameOverBody = $("#modalGameOverBody")
	//对手名字
	var opponent = $("#opponent")
	//status
	var opponentStatus=$("#status2")
    var meStatus=$("#status1")
    
	if(!("WebSocket" in window)){
      modalErrorBody.text('WebSockets are not supported in this ' +
                            'browser. Try Internet Explorer 10 or the latest ' +
                            'versions of Mozilla Firefox or Google Chrome.')
                    modalError.modal('show')
    }
	//连接服务器
	modalWaitingBody.text('正在连接服务器')
    modalWaiting.modal({ keyboard: false, show: true })
    
	var gameId=document.getElementById('gameId').value
	var userName=document.getElementById('username').value
	var action=document.getElementById('action').value
	var server
    try {
             server = new WebSocket('ws://' + window.location.host +
             "/game"+"/game/"+gameId+"/"+userName
             	+"?action="+ action)
        } catch(error) {
             modalWaiting.modal('hide')
             modalErrorBody.text(error)
             modalError.modal('show')
             return
    }
    //连接开启
    server.onopen = function(event) {
            modalWaitingBody.text('等待对手加入游戏')
            modalWaiting.modal({ keyboard: false, show: true })
        }
    window.onbeforeunload = function() {
    	server.close()
    }
    //连接关闭
    server.onclose = function(event) {
        if(!event.wasClean || event.code != 1000) {
            modalWaiting.modal('hide')
            modalErrorBody.text('Code ' + event.code + ': ' +
                    event.reason)
            modalError.modal('show')
        }
    }
    //发生错误
    server.onerror = function(event) {
        modalWaiting.modal('hide')
        modalErrorBody.text(event.data)
        modalError.modal('show')
    }
    
    //接受消息
    var opponentUsername
    var meFirst=document.getElementById('meFirst')//是否先开球
    var start=document.getElementById('start')//已开球，游戏开始
    
    //坐标、分数、状态
    var ballX=document.getElementById('ballX')
    var ballY=document.getElementById('ballY')
    var paddleX=document.getElementById('paddleX')
    var paddleY=document.getElementById('paddleY')
    var score=document.getElementById('score')
    var status=document.getElementById('status')
    var indexOfBrick=document.getElementById('index')
    //是否收到数据
    var dataAccess=document.getElementById('dataAccess')
    
    server.onmessage = function(event) {
    	var message = JSON.parse(event.data)
        if(message.action == 'gameReady') {
            if(message.game.player1 == userName){//确定user和opponent
                opponentUsername = message.game.player2
            }
            else{
                opponentUsername = message.game.player1
            }
            opponent.text("对手："+opponentUsername)
            if(message.game.player1 == userName){
            	meFirst.value=true
            	meStatus.text("发球")
            }
            else{
            	meFirst.value=false
            	meStatus.text("等待对手发球")
            }          	
            modalWaiting.modal('hide')
        }
        else if (message.action == 'gameStarted'){
        	start.value=true
        	meStatus.text("游戏开始")
        	opponentStatus.text("游戏开始")
        }
        else if(message.action=="gameMove"){
        	ballX.value=message.messageToServer.ballX
        	ballY.value=message.messageToServer.ballY
        	paddleX.value=message.messageToServer.paddleX
        	paddleY.value=message.messageToServer.paddleY
        	score.value=message.messageToServer.score
        	index.value=message.messageToServer.indexOfBrick
        	
        	dataAccess.value=1//是否收到数据
        }
        else if (message.action == 'gameWin'){
        	status.value="1"//获胜
        	meStatus.text("获胜")
            opponentStatus.text("失败")
        	modalGameOverBody.text("您已获胜")
            modalGameOver.modal('show')
        }
        else if (message.action == 'gameLose'){
        	status.value="0"//失败
        	meStatus.text("失败")
            opponentStatus.text("获胜")
        	modalGameOverBody.text("对方获胜")
            modalGameOver.modal('show')
        }
        else if (message.action == 'gameForfeited'){
        	status.value="1"
        	meStatus.text("对方退出")
        	opponentStatus.text("退出")
        	modalGameOverBody.text("对方退出")
            modalGameOver.modal('show')
        }
    }
    
    __main(server)
})