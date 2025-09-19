package dev.ctrlspace.bootcamp202506.springapi.repositories;

import dev.ctrlspace.bootcamp202506.springapi.models.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Get all messages for a chat by chatId, ordered by creation time
    List<Message> findByChatIdOrderByCreatedAtAsc(Long chatId);

    // Delete all messages for a specific chat (used when deleting a chat)
    void deleteByChatId(Long chatId);
}