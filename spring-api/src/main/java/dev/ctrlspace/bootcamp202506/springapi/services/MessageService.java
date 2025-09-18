package dev.ctrlspace.bootcamp202506.springapi.services;

import dev.ctrlspace.bootcamp202506.springapi.models.Message;
import dev.ctrlspace.bootcamp202506.springapi.repositories.MessageRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List; // Add this missing import

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final CompletionsApiService completionsApiService;

    public MessageService(MessageRepository messageRepository, CompletionsApiService completionsApiService) {
        this.messageRepository = messageRepository;
        this.completionsApiService = completionsApiService;
    }

    public Message createMessage(Message message) {
        // Save user message to DB here if you want (optional)

        // Call AI
        String aiResponse = completionsApiService.getCompletion(message.getContent());

        // Create AI message
        Message llmMessage = new Message();
        llmMessage.setContent(aiResponse);
        llmMessage.setChatId(message.getChatId());
        llmMessage.setCreatedAt(java.time.Instant.now());
        llmMessage.setCreatedByUserId(null);

        // Save AI message to DB here if you want (optional)
        return llmMessage;
    }

    public List<Message> getMessagesByChatId(Long chatId) {
        try {
            System.out.println("Fetching messages for chatId: " + chatId);
            List<Message> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(chatId);
            System.out.println("Found " + messages.size() + " messages");
            return messages;
        } catch (Exception e) {
            System.err.println("Error fetching messages for chatId " + chatId + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
}