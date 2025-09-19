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
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/chats")
@Scope(
        value = WebApplicationContext.SCOPE_REQUEST,
        proxyMode = ScopedProxyMode.TARGET_CLASS
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
    public List<Chat> getAllChats(@RequestParam(required = false) Long userId,
                                  @RequestParam(required = false) String username,
                                  Authentication authentication) throws BootcampException {

        User loggedInUser = userService.getLoggedInUser(authentication);
        logger.debug("Logged in user: " + loggedInUser.getUsername() + " (ID: " + loggedInUser.getId() + ")");

        // Create criteria - only allow users to see their own chats unless they're admin
        ChatCriteria criteria = new ChatCriteria();

        if ("ROLE_ADMIN".equals(loggedInUser.getRole()) && userId != null) {
            // Admin can specify userId to see other users' chats
            criteria.setUserId(userId);
        } else {
            // Regular users can only see their own chats
            criteria.setUserId(loggedInUser.getId());
        }

        if (username != null && "ROLE_ADMIN".equals(loggedInUser.getRole())) {
            criteria.setUsername(username);
        }

        return chatService.getAll(criteria);
    }

    @PostMapping
    public Chat createChat(@RequestBody Chat chat, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);

        // Ensure the chat is created for the logged-in user
        chat.setUserId(loggedInUser.getId());
        chat.setCreatedAt(Instant.now());

        return chatService.createChat(chat);
    }

    @PutMapping("/{id}")
    public Chat updateChat(@PathVariable Long id, @RequestBody Chat chatUpdate, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);

        // Verify the chat belongs to the logged-in user (or user is admin)
        Chat existingChat = chatService.getChatById(id);
        if (existingChat == null) {
            throw new BootcampException(HttpStatus.NOT_FOUND, "Chat not found");
        }

        if (!existingChat.getUserId().equals(loggedInUser.getId()) && !"ROLE_ADMIN".equals(loggedInUser.getRole())) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You can only update your own chats");
        }

        return chatService.updateChat(id, chatUpdate);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteChat(@PathVariable Long id, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);

        // Verify the chat belongs to the logged-in user (or user is admin)
        Chat existingChat = chatService.getChatById(id);
        if (existingChat == null) {
            throw new BootcampException(HttpStatus.NOT_FOUND, "Chat not found");
        }

        if (!existingChat.getUserId().equals(loggedInUser.getId()) && !"ROLE_ADMIN".equals(loggedInUser.getRole())) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You can only delete your own chats");
        }

        chatService.deleteChat(id);
        return ResponseEntity.ok().build();
    }
}