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
        // Save user message
        message.setCreatedAt(Instant.now());
        message.setFromSelf(true); // mark as user message
        Message savedUserMessage = messageRepository.save(message);

        // Generate AI response
        String llmResponse = completionsApiService.getCompletion(
                "llama-3.1-8b-instant",
                message.getContent()
        );

        Message aiMessage = new Message();
        aiMessage.setChatId(message.getChatId());
        aiMessage.setContent(llmResponse);
        aiMessage.setCreatedAt(Instant.now());
        aiMessage.setFromSelf(false); // mark as AI message

        return messageRepository.save(aiMessage);
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