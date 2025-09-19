package dev.ctrlspace.bootcamp202506.springapi.services;

import dev.ctrlspace.bootcamp202506.springapi.exceptions.BootcampException;
import dev.ctrlspace.bootcamp202506.springapi.models.Chat;
import dev.ctrlspace.bootcamp202506.springapi.models.criteria.ChatCriteria;
import dev.ctrlspace.bootcamp202506.springapi.repositories.ChatRepository;
import dev.ctrlspace.bootcamp202506.springapi.repositories.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class ChatService {

    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;

    @Autowired
    public ChatService(ChatRepository chatRepository, MessageRepository messageRepository) {
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
    }

    public List<Chat> getAll(ChatCriteria criteria) throws BootcampException {

        Instant twoYearsAgo = Instant.now().minusSeconds(60 * 60 * 24 * 365 * 2);

        if (criteria.getFrom() != null && criteria.getFrom().isBefore(twoYearsAgo)) {
            throw new BootcampException(HttpStatus.BAD_REQUEST,
                    "The 'from' date cannot be more than two years ago.");
        }

        return chatRepository.findAll(criteria.getUserId(),
                criteria.getUsername(),
                criteria.getFrom(),
                criteria.getTo());
    }

    public Chat createChat(Chat chat) {
        chat.setCreatedAt(Instant.now());
        return chatRepository.save(chat);
    }

    public Chat updateChat(Long id, Chat chatUpdate) throws BootcampException {
        Chat existingChat = chatRepository.findById(id)
                .orElseThrow(() -> new BootcampException(HttpStatus.NOT_FOUND, "Chat not found with id: " + id));

        if (chatUpdate.getTitle() != null) {
            existingChat.setTitle(chatUpdate.getTitle());
        }

        return chatRepository.save(existingChat);
    }

    public Chat getChatById(Long id) {
        Optional<Chat> chat = chatRepository.findById(id);
        return chat.orElse(null);
    }

    @Transactional
    public void deleteChat(Long id) throws BootcampException {
        Chat existingChat = chatRepository.findById(id)
                .orElseThrow(() -> new BootcampException(HttpStatus.NOT_FOUND, "Chat not found with id: " + id));

        // Delete all messages in this chat first
        messageRepository.deleteByChatId(id);

        // Then delete the chat
        chatRepository.delete(existingChat);
    }
}