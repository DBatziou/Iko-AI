package dev.ctrlspace.bootcamp202506.springapi.controllers;

import dev.ctrlspace.bootcamp202506.springapi.exceptions.BootcampException;
import dev.ctrlspace.bootcamp202506.springapi.models.Chat;
import dev.ctrlspace.bootcamp202506.springapi.models.Message;
import dev.ctrlspace.bootcamp202506.springapi.models.User;
import dev.ctrlspace.bootcamp202506.springapi.services.ChatService;
import dev.ctrlspace.bootcamp202506.springapi.services.MessageService;
import dev.ctrlspace.bootcamp202506.springapi.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @PostMapping("/with-model")
    public Message createMessageWithModel(@RequestBody Map<String, Object> payload, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);

        // Extract data from payload
        String content = (String) payload.get("content");
        Long chatId = Long.valueOf(payload.get("chatId").toString());
        String model = (String) payload.getOrDefault("model", "llama-3.1-8b-instant");

        // Verify the chat belongs to the logged-in user
        Chat chat = chatService.getChatById(chatId);
        if (chat == null) {
            throw new BootcampException(HttpStatus.NOT_FOUND, "Chat not found");
        }

        if (!chat.getUserId().equals(loggedInUser.getId()) && !"ROLE_ADMIN".equals(loggedInUser.getRole())) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You can only send messages to your own chats");
        }

        // Create message object
        Message message = new Message();
        message.setContent(content);
        message.setChatId(chatId);
        message.setCreatedByUserId(loggedInUser.getId());

        return messageService.createMessageWithModel(message, model);
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

    @PutMapping("/{id}")
    public Message updateMessage(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);
        String newContent = payload.get("content");

        Message message = messageService.getMessageById(id);
        if (message == null) {
            throw new BootcampException(HttpStatus.NOT_FOUND, "Message not found");
        }

        // Verify ownership - only the user who created the message can edit it
        if (!message.getCreatedByUserId().equals(loggedInUser.getId()) && !"ROLE_ADMIN".equals(loggedInUser.getRole())) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You can only edit your own messages");
        }

        // Only allow editing user messages, not AI messages
        if (!message.getFromSelf()) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You cannot edit AI messages");
        }

        return messageService.updateMessage(id, newContent);
    }

    @PostMapping("/{id}/regenerate")
    public Message regenerateMessage(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);
        String model = payload != null ? payload.getOrDefault("model", "llama-3.1-8b-instant") : "llama-3.1-8b-instant";
        String newUserInput = payload != null ? payload.get("newUserInput") : null;

        Message message = messageService.getMessageById(id);
        if (message == null) {
            throw new BootcampException(HttpStatus.NOT_FOUND, "Message not found");
        }

        // Only allow regenerating AI messages
        if (message.getFromSelf()) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You can only regenerate AI messages");
        }

        // Verify chat ownership
        Chat chat = chatService.getChatById(message.getChatId());
        if (!chat.getUserId().equals(loggedInUser.getId()) && !"ROLE_ADMIN".equals(loggedInUser.getRole())) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You can only regenerate messages in your own chats");
        }

        return messageService.regenerateMessage(id, model, newUserInput);
    }
}