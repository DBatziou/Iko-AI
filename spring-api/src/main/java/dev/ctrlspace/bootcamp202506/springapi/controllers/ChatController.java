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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestController
@Scope(
        value         = WebApplicationContext.SCOPE_REQUEST,
        proxyMode     = ScopedProxyMode.TARGET_CLASS
)
public class ChatController {

    Logger logger = LoggerFactory.getLogger(ChatController.class);
    // Example of circular dependency resolution using @Lazy
//    private UserController userController;
//
//    @Autowired
//    public ChatController(@Lazy UserController userController) {
//        this.userController = userController;
//    }

    private final ChatService chatService;
    private UserService userService;

    @Autowired
    public ChatController(ChatService chatService, UserService userService) {
        this.chatService = chatService;
        this.userService = userService;

        logger.debug("ChatController initialized with ChatService: " + userService);

    }

    @GetMapping("/chats")
    public List<Chat> getAllChats(ChatCriteria criteria) throws BootcampException {

        // validate that the login username is equal to the username parameter


        return chatService.getAll(criteria);
    }
}
