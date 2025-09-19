package dev.ctrlspace.bootcamp202506.springapi.services;

import dev.ctrlspace.bootcamp202506.springapi.models.Message;
import dev.ctrlspace.bootcamp202506.springapi.repositories.MessageRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final CompletionsApiService completionsApiService;

    public MessageService(MessageRepository messageRepository, CompletionsApiService completionsApiService) {
        this.messageRepository = messageRepository;
        this.completionsApiService = completionsApiService;
    }

    public Message createMessage(Message message) {
        try {
            // First, save the user message to database
            message.setCreatedAt(Instant.now());
            message.setFromSelf(true); // Mark as user message
            Message savedUserMessage = messageRepository.save(message);

            System.out.println("User message saved: " + savedUserMessage.getContent());

            // Get AI response
            String aiResponse = completionsApiService.getCompletion("llama-3.1-8b-instant", message.getContent());
            System.out.println("AI response received: " + aiResponse);

            // Create and save AI message
            Message aiMessage = new Message();
            aiMessage.setContent(aiResponse);
            aiMessage.setChatId(message.getChatId());
            aiMessage.setCreatedAt(Instant.now());
            aiMessage.setFromSelf(false); // Mark as AI message
            aiMessage.setCreatedByUserId(null); // AI messages don't have a user ID

            Message savedAiMessage = messageRepository.save(aiMessage);
            System.out.println("AI message saved: " + savedAiMessage.getContent());

            // Return the AI message (the frontend expects this)
            return savedAiMessage;

        } catch (Exception e) {
            System.err.println("Error in createMessage: " + e.getMessage());
            e.printStackTrace();

            // Create an error message
            Message errorMessage = new Message();
            errorMessage.setContent("Sorry, I encountered an error processing your message. Please try again.");
            errorMessage.setChatId(message.getChatId());
            errorMessage.setCreatedAt(Instant.now());
            errorMessage.setFromSelf(false);
            errorMessage.setCreatedByUserId(null);

            return messageRepository.save(errorMessage);
        }
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