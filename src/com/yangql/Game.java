package com.yangql;

import java.util.Hashtable;
import java.util.Map;
import java.util.Random;


public class Game {
	//global
	private static Map<Long, String>pendingGames=new Hashtable<Long, String>();
	private static Map<Long, Game>activeGames=new Hashtable<Long, Game>();
	private static long gameIdSequence = 1L;
	
	
	//class member
	private long id;
	private String player1;
	private String player2;
	private Player whoFirst = Player.random();
	private boolean over;
	
	public Game(long id,String player1,String player2) {
		this.id=id;
		this.player1=player1;
		this.player2=player2;
	}
	
	public static Map<Long, String> getPendingGames() {
		return pendingGames;
	}
	
	public static long queueGame(String user1)
    {
        long id = gameIdSequence++;
        pendingGames.put(id, user1);
        return id;
    }
	public static void removeQueuedGame(long queuedId)
    {
        pendingGames.remove(queuedId);
    }
	public static Game startGames(long queuedId, String user2) {
		String user1 = pendingGames.remove(queuedId);
        Game game = new Game(queuedId, user1, user2);
        activeGames.put(queuedId, game);
        return game;
	}
	public static Game getActiveGame(long gameId)
    {
        return activeGames.get(gameId);
    }
	//游戏是否结束
	public void setOver() {
		this.over=true;
	}
	public boolean isOver() {
		return over;
	}
	//中途退出
	public synchronized void forfeit(Player player)
    {
        Game.activeGames.remove(this.id);
        this.over = true;
    }
	//getter
	public long getId()
    {
        return id;
    }

    public String getPlayer1()
    {
        return player1;
    }

    public String getPlayer2()
    {
        return player2;
    }
    
    //决定开球者
    public String getWhoFirst()
    {
        return whoFirst == Player.PLAYER1 ? player1 : player2;
    }
    public enum Player
    {
        PLAYER1, PLAYER2;

        private static final Random random = new Random();

        private static Player random()
        {
            return Player.random.nextBoolean() ? PLAYER1 : PLAYER2;
        }
    }
}
