package com.yangql;

import org.apache.commons.lang3.math.NumberUtils;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@WebServlet(
        name = "GameServlet",
        urlPatterns = "/gameServlet"
)
public class GameServlet extends HttpServlet
{
	/*
	 * 列出当前游戏
	 * @see javax.servlet.http.HttpServlet#doGet(javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
	 */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException
    {
        request.setAttribute("pendingGames", Game.getPendingGames());
        this.view("list", request, response);
    }
    /*
     * 处理创建、加入游戏请求
     * @see javax.servlet.http.HttpServlet#doPost(javax.servlet.http.HttpServletRequest, javax.servlet.http.HttpServletResponse)
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException
    {
        String action = request.getParameter("action");
        if("join".equalsIgnoreCase(action))// 加入已有游戏
        {
            String gameIdString = request.getParameter("gameId");
            String username = request.getParameter("username");
            if(username == null || gameIdString == null ||
                    !NumberUtils.isDigits(gameIdString))
                this.list(request, response);
            else
            {
                request.setAttribute("action", "join");
                request.setAttribute("username", username);
                request.setAttribute("gameId", Long.parseLong(gameIdString));
                this.view("game", request, response);
            }
        }
        else if("start".equalsIgnoreCase(action))//创建游戏
        {
            String username = request.getParameter("username");
            if(username == null)
                this.list(request, response);
            else
            {
                request.setAttribute("action", "start");
                request.setAttribute("username", username);
                request.setAttribute("gameId", Game.queueGame(username));
                this.view("game", request, response);
            }
        }
        else
            this.list(request, response);
    }
    
    /*
     * 重定向到视图（list.jsp/game.jsp）
     */
    private void view(String view, HttpServletRequest request,
                      HttpServletResponse response)
            throws ServletException, IOException
    {
        request.getRequestDispatcher("/WEB-INF/jsp/view/"+view+".jsp")
               .forward(request, response);
    }
    /*
     * 重定向到主页（list.jsp）
     */
    private void list(HttpServletRequest request, HttpServletResponse response)
            throws IOException
    {
        response.sendRedirect(response.encodeRedirectURL(
                request.getContextPath() + "/gameServlet"
        ));
    }
}