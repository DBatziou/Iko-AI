package dev.ctrlspace.bootcamp202506.springapi.models.criteria;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatCriteria {

    private Long userId;
    private String username;
    private Instant from;
    private Instant to;
}
