package dev.ctrlspace.bootcamp202506.springapi.models.dtos.completions;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usage {
    @JsonProperty("queue_time")
    private double queueTime;

    @JsonProperty("prompt_tokens")
    private int promptTokens;

    @JsonProperty("prompt_time")
    private double promptTime;

    @JsonProperty("completion_tokens")
    private int completionTokens;

    @JsonProperty("completion_time")
    private double completionTime;

    @JsonProperty("total_tokens")
    private int totalTokens;

    @JsonProperty("total_time")
    private double totalTime;
}