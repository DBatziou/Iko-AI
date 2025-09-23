package dev.ctrlspace.bootcamp202506.springapi.models;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_id")
    private Long chatId;

    @Column(name = "created_by_user_id")
    private Long createdByUserId; // optional, can be null for AI

    private String content;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    // Add this field that was missing
    @Column(name = "from_self")
    private Boolean fromSelf;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getChatId() { return chatId; }
    public void setChatId(Long chatId) { this.chatId = chatId; }

    public Long getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(Long createdByUserId) { this.createdByUserId = createdByUserId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    // Add getter and setter for fromSelf
    public Boolean getFromSelf() { return fromSelf; }

    public void setFromSelf(Boolean fromSelf) { this.fromSelf = fromSelf; }
}