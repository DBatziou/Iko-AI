package dev.ctrlspace.bootcamp202506.springapi.models.dtos.completions;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Choice {
    private int index;
    private ResponseMessage message;
    private Object logprobs;

    @JsonProperty("finish_reason")
    private String finishReason;
}
