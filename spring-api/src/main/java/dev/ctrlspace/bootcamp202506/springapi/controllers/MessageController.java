package dev.ctrlspace.bootcamp202506.springapi.controllers;

import dev.ctrlspace.bootcamp202506.springapi.exceptions.BootcampException;
import dev.ctrlspace.bootcamp202506.springapi.models.Chat;
import dev.ctrlspace.bootcamp202506.springapi.models.Message;
import dev.ctrlspace.bootcamp202506.springapi.models.User;
import dev.ctrlspace.bootcamp202506.springapi.services.ChatService;
import dev.ctrlspace.bootcamp202506.springapi.services.MessageService;
import dev.ctrlspace.bootcamp202506.springapi.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
public class MessageController {

    private final MessageService messageService;
    private final UserService userService;
    private final ChatService chatService;

    public MessageController(MessageService messageService, UserService userService, ChatService chatService) {
        this.messageService = messageService;
        this.userService = userService;
        this.chatService = chatService;
    }

    @PostMapping
    public Message createMessage(@RequestBody Message message, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);

        // Verify the chat belongs to the logged-in user
        Chat chat = chatService.getChatById(message.getChatId());
        if (chat == null) {
            throw new BootcampException(HttpStatus.NOT_FOUND, "Chat not found");
        }

        if (!chat.getUserId().equals(loggedInUser.getId()) && !"ROLE_ADMIN".equals(loggedInUser.getRole())) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You can only send messages to your own chats");
        }

        // Set the user who created the message
        message.setCreatedByUserId(loggedInUser.getId());

        return messageService.createMessage(message);
    }

    @GetMapping("/{chatId}")
    public List<Message> getMessages(@PathVariable Long chatId, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);

        // Verify the chat belongs to the logged-in user
        Chat chat = chatService.getChatById(chatId);
        if (chat == null) {
            throw new BootcampException(HttpStatus.NOT_FOUND, "Chat not found");
        }

        if (!chat.getUserId().equals(loggedInUser.getId()) && !"ROLE_ADMIN".equals(loggedInUser.getRole())) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You can only view messages from your own chats");
        }

        return messageService.getMessagesByChatId(chatId);
    }
}