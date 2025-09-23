package dev.ctrlspace.bootcamp202506.springapi.services;

import dev.ctrlspace.bootcamp202506.springapi.exceptions.BootcampException;
import dev.ctrlspace.bootcamp202506.springapi.models.Message;
import dev.ctrlspace.bootcamp202506.springapi.repositories.MessageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final CompletionsApiService completionsApiService;

    public MessageService(MessageRepository messageRepository, CompletionsApiService completionsApiService) {
        this.messageRepository = messageRepository;
        this.completionsApiService = completionsApiService;
    }

    public Message createMessage(Message message) {
        return createMessageWithModel(message, "llama-3.1-8b-instant");
    }

    public Message createMessageWithModel(Message message, String model) {
        try {
            // First, save the user message to database
            message.setCreatedAt(Instant.now());
            message.setFromSelf(true); // Mark as user message
            Message savedUserMessage = messageRepository.save(message);

            System.out.println("User message saved: " + savedUserMessage.getContent());

            // Get conversation history BEFORE generating AI response
            List<Message> conversationHistory = messageRepository.findByChatIdOrderByCreatedAtAsc(message.getChatId());

            // Get AI response using specified model with conversation history
            String aiResponse = completionsApiService.getCompletionWithHistory(model, conversationHistory, message.getContent());
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

    public Message getMessageById(Long id) {
        Optional<Message> message = messageRepository.findById(id);
        return message.orElse(null);
    }

    public Message updateMessage(Long id, String newContent) throws BootcampException {
        Message message = messageRepository.findById(id)
                .orElseThrow(() -> new BootcampException(HttpStatus.NOT_FOUND, "Message not found with id: " + id));

        message.setContent(newContent);
        return messageRepository.save(message);
    }

    public Message regenerateMessage(Long id, String model) throws BootcampException {
        return regenerateMessage(id, model, null);
    }

    public Message regenerateMessage(Long id, String model, String newUserInput) throws BootcampException {
        Message aiMessage = messageRepository.findById(id)
                .orElseThrow(() -> new BootcampException(HttpStatus.NOT_FOUND, "Message not found with id: " + id));

        try {
            String promptToUse = newUserInput;

            // If no new user input provided, find the previous user message
            if (promptToUse == null) {
                List<Message> messages = messageRepository.findByChatIdOrderByCreatedAtAsc(aiMessage.getChatId());
                Message userMessage = null;

                for (int i = 0; i < messages.size(); i++) {
                    if (messages.get(i).getId().equals(id) && i > 0) {
                        userMessage = messages.get(i - 1);
                        break;
                    }
                }

                if (userMessage == null || !userMessage.getFromSelf()) {
                    throw new BootcampException(HttpStatus.BAD_REQUEST, "Cannot find corresponding user message");
                }

                promptToUse = userMessage.getContent();
            }

            // Get conversation history up to the point of regeneration
            List<Message> conversationHistory = messageRepository.findByChatIdOrderByCreatedAtAsc(aiMessage.getChatId());
            // Remove messages after the one we're regenerating to avoid confusion
            conversationHistory.removeIf(msg -> msg.getCreatedAt().isAfter(aiMessage.getCreatedAt()) || msg.getId().equals(id));

            // Generate new AI response using specified model with conversation history
            String newAiResponse = completionsApiService.getCompletionWithHistory(model, conversationHistory, promptToUse);

            // Update the existing AI message
            aiMessage.setContent(newAiResponse);
            aiMessage.setCreatedAt(Instant.now()); // Update timestamp

            return messageRepository.save(aiMessage);

        } catch (Exception e) {
            System.err.println("Error regenerating message: " + e.getMessage());
            e.printStackTrace();
            throw new BootcampException(HttpStatus.INTERNAL_SERVER_ERROR, "Error regenerating message: " + e.getMessage());
        }
    }
}