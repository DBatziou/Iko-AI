package dev.ctrlspace.bootcamp202506.springapi.controllers;

import dev.ctrlspace.bootcamp202506.springapi.models.Message;
import dev.ctrlspace.bootcamp202506.springapi.services.MessageService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    // Create a message and get AI response
    @PostMapping
    public Message createMessage(@RequestBody Message message) {
        return messageService.createMessage(message);
    }

    // Get all messages for a chat
    @GetMapping("/{chatId}")
    public List<Message> getMessages(@PathVariable Long chatId) {
        return messageService.getMessagesByChatId(chatId);
    }
}
