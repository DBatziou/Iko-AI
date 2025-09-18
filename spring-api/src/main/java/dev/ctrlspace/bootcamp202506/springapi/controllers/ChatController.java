package dev.ctrlspace.bootcamp202506.springapi.controllers;

import dev.ctrlspace.bootcamp202506.springapi.exceptions.BootcampException;
import dev.ctrlspace.bootcamp202506.springapi.models.Chat;
import dev.ctrlspace.bootcamp202506.springapi.models.User;
import dev.ctrlspace.bootcamp202506.springapi.models.criteria.ChatCriteria;
import dev.ctrlspace.bootcamp202506.springapi.services.ChatService;
import dev.ctrlspace.bootcamp202506.springapi.services.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/chats") // Add this mapping
@Scope(
        value         = WebApplicationContext.SCOPE_REQUEST,
        proxyMode     = ScopedProxyMode.TARGET_CLASS
)
public class ChatController {

    Logger logger = LoggerFactory.getLogger(ChatController.class);

    private final ChatService chatService;
    private UserService userService;

    @Autowired
    public ChatController(ChatService chatService, UserService userService) {
        this.chatService = chatService;
        this.userService = userService;
        logger.debug("ChatController initialized with ChatService: " + userService);
    }

    @GetMapping
    public List<Chat> getAllChats(ChatCriteria criteria, HttpServletRequest request) throws BootcampException {
        // Debug: Log the authorization header
        String authHeader = request.getHeader("Authorization");
        logger.debug("Authorization header: " + (authHeader != null ? "Present" : "Missing"));
        logger.debug("Request from: " + request.getRemoteAddr());

        return chatService.getAll(criteria);
    }

    // Add this POST endpoint for creating new chats
    @PostMapping
    public Chat createChat(@RequestBody Chat chat) {
        return chatService.createChat(chat);
    }

    // Add this PUT endpoint for updating chat titles
    @PutMapping("/{id}")
    public Chat updateChat(@PathVariable Long id, @RequestBody Chat chatUpdate) {
        return chatService.updateChat(id, chatUpdate);
    }
}