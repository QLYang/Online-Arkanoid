package com.yangql;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;

import javax.websocket.CloseReason;
import javax.websocket.OnClose;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;


@ServerEndpoint("/game/{gameId}/{username}")
public class GameServer {
	private static Map<Long, serverGame> games = new Hashtable<>();
    private static ObjectMapper mapper = new ObjectMapper();
    
    private static class serverGame
    {
        public long gameId;

        public Session player1;

        public Session player2;

        public Game Game;
    }
    
    @OnOpen
    public void onOpen(Session session, @PathParam("gameId") long gameId,
                       @PathParam("username") String username)
    {
        try
        {
            Game hitBlockGame =Game.getActiveGame(gameId);
            if(hitBlockGame != null)//正常情况下，游戏尚未激活
            {
                session.close(new CloseReason(
                        CloseReason.CloseCodes.UNEXPECTED_CONDITION,
                        "游戏已经开始"
                ));
            }

            List<String> actions = session.getRequestParameterMap().get("action");
            if(actions != null && actions.size() == 1)
            {
                String action = actions.get(0);
                if("start".equalsIgnoreCase(action))
                {
                    serverGame game = new serverGame();
                    game.gameId = gameId;
                    game.player1 = session;
                    games.put(gameId, game);
                }
                else if("join".equalsIgnoreCase(action))
                {
                    serverGame game = games.get(gameId);
                    game.player2 = session; 
                    game.Game = Game.startGames(gameId, username);//激活游戏
                    this.sendJsonMessage(game.player1, game,
                            new GameReadyMessage(game.Game));//告诉player1游戏已准备
                    this.sendJsonMessage(game.player2, game,
                            new GameReadyMessage(game.Game));//告诉player1游戏已准备
                }
            }
        }
        catch(IOException e)
        {
            e.printStackTrace();
            try
            {
                session.close(new CloseReason(
                        CloseReason.CloseCodes.UNEXPECTED_CONDITION, e.toString()
                ));
            }
            catch(IOException ignore) { }
        }
    }
    
    @OnMessage
    public void onMessage(Session session, String message,
                          @PathParam("gameId") long gameId)
    {
        serverGame game =games.get(gameId);
        boolean isPlayer1 = session == game.player1;

        try
        {
            MassageToServer msgToServer=mapper.readValue(message, MassageToServer.class);
            //发球后游戏开始
            if(msgToServer.type==1) {//start
            	this.sendJsonMessage((isPlayer1 ? game.player2 : game.player1), game,
                       new GameStartedMessage());
            }
            //将球和踏板的坐标发给对手
            if(msgToServer.type==2) {//move
            	if(msgToServer.status==2) {
            		this.sendJsonMessage((isPlayer1 ? game.player2 : game.player1), game,
            				new GameMoveMessage(msgToServer));
            	}
            	if(msgToServer.status==0) {//消息发送者游戏失败
            		this.sendJsonMessage((isPlayer1 ? game.player2 : game.player1), game,
                            new GameWinMessage());//发送获胜信息给对手
            		this.sendJsonMessage((isPlayer1 ? game.player1 : game.player2), game,
                            new GameLoseMessage());//发送失败信息给自己
            		game.Game.setOver();
            	}
            	if(msgToServer.status==1) {//消息发送者游戏胜利
            		this.sendJsonMessage((isPlayer1 ? game.player2 : game.player1), game,
                            new GameLoseMessage());//发送失败信息给对手
            		this.sendJsonMessage((isPlayer1 ? game.player1 : game.player2), game,
                            new GameWinMessage());//发送获胜信息给自己
            		game.Game.setOver();
            	}
            }
        }
        catch(IOException e)
        {
            this.handleException(e, game);
        }
    }
    @OnClose
    public void onClose(Session session, @PathParam("gameId") long gameId) {
    	serverGame game = games.get(gameId);
    	if(game == null)
            return;
    	//服务器中存在游戏实例
    	boolean isPlayer1 = session == game.player1;
        if(game.Game == null)//半初始化状态（只有player1连接到服务器，没有player2和Game实例）
        {
            Game.removeQueuedGame(game.gameId);
        }
        else if(!game.Game.isOver())//如果不是正常的游戏结束后退出，通知对方
        {
            game.Game.forfeit(isPlayer1 ? Game.Player.PLAYER1 :
                    Game.Player.PLAYER2);
            Session opponent = (isPlayer1 ? game.player2 : game.player1);
            this.sendJsonMessage(opponent, game, new GameForfeitedMessage());
            try
            {
                opponent.close();
            }
            catch(IOException e)
            {
                e.printStackTrace();
            }
        }
        //正常退出
        else if(game.Game.isOver()){
        	try {
        		game.player1.close();
    			game.player2.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
			
		}
    }
    /*
     * Send Message
     */
    private void sendJsonMessage(Session session, serverGame game, Message message)
    {
        try
        {
            session.getBasicRemote()
                   .sendText(mapper.writeValueAsString(message));
        }
        catch(IOException e)
        {
            this.handleException(e, game);
        }
    }
    /*
     * Exception handler
     */
    private void handleException(Throwable t, serverGame game)
    {
        t.printStackTrace();
        String message = t.toString();
        try
        {
            game.player1.close(new CloseReason(
                    CloseReason.CloseCodes.UNEXPECTED_CONDITION, message
            ));
        }
        catch(IOException ignore) { }
        try
        {
            game.player2.close(new CloseReason(
                    CloseReason.CloseCodes.UNEXPECTED_CONDITION, message
            ));
        }
        catch(IOException ignore) { }
    }
    /*
     * Message
     */
    public static abstract class Message
    {
        private final String action;

        public Message(String action)
        {
            this.action = action;
        }

        public String getAction()
        {
            return this.action;
        }
    }

    public static class GameReadyMessage extends Message
    {
        private final Game game;

        public GameReadyMessage(Game game)
        {
            super("gameReady");
            this.game = game;
        }

        public Game getGame()
        {
            return game;
        }
    }
    
    public static class GameStartedMessage extends Message
    {
        public GameStartedMessage()
        {
            super("gameStarted");
        }
    }
    public static class GameMoveMessage extends Message
    {
        private final MassageToServer msg;

        public GameMoveMessage(MassageToServer msg)
        {
            super("gameMove");
            this.msg = msg;
        }

        public MassageToServer getMessageToServer()
        {
            return this.msg;
        }
    }
    public static class GameLoseMessage extends Message
    {
        public GameLoseMessage() {
            super("gameLose");
        }
    }
    public static class GameWinMessage extends Message
    {
        public GameWinMessage() {
            super("gameWin");
        }
    }
    public static class GameForfeitedMessage extends Message
    {
        public GameForfeitedMessage() {
            super("gameForfeited");
        }

    }
    public static class MassageToServer{
    	private int type;//1:start,2:move
    	private int ballX;
    	private int ballY;
    	private int paddleX;
    	private int paddleY;
    	private int score;
    	private int status;//0:lose,1:win
    	private int indexOfBrick;//被击中的球编号(非0)
    	
    	public void setType(int type) {
			this.type=type;
		}
    	public int getType() {
			return this.type;
		}
    	public void setBallX(int ballX) {
			this.ballX=ballX;
		}
    	public int getBallX() {
			return this.ballX;
		}
    	public void setBallY(int ballY) {
			this.ballY=ballY;
		}
    	public int getBallY() {
			return this.ballY;
		}
    	public void setPaddleX(int paddleX) {
			this.paddleX=paddleX;
		}
    	public int getPaddleX() {
			return this.paddleX;
		}
    	public void setPaddleY(int paddleY) {
			this.paddleY=paddleY;
		}
    	public int getPaddleY() {
			return this.paddleY;
		}
    	public void setScore(int score) {
			this.score=score;
		}
    	public int getScore() {
			return this.score;
		}
    	public void setStatus(int status) {
			this.status=status;
		}
    	public int getStatus() {
			return this.status;
		}
    	public void setIndexOfBrick(int index) {
			this.indexOfBrick=index;
		}
    	public int getIndexOfBrick() {
			return this.indexOfBrick;
		}
    }
}