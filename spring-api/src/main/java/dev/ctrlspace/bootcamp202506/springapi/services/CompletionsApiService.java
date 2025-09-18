package dev.ctrlspace.bootcamp202506.springapi.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

@Service
public class CompletionsApiService {

    @Value("${llms.groq.key}")
    private String groqApiKey;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public CompletionsApiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public String getCompletion(String model, String userMessage) {
        try {
            // Groq API endpoint
            String url = "https://api.groq.com/openai/v1/chat/completions";

            // Create headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            // Create request body
            GroqRequest request = new GroqRequest();
            request.setModel(model);
            request.setMessages(List.of(new GroqMessage("user", userMessage)));
            request.setMaxTokens(1024);
            request.setTemperature(0.7);

            // Convert to JSON
            String requestBody = objectMapper.writeValueAsString(request);

            // Create HTTP entity
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            // Make the API call
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            // Parse response
            if (response.getStatusCode() == HttpStatus.OK) {
                GroqResponse groqResponse = objectMapper.readValue(response.getBody(), GroqResponse.class);
                if (groqResponse.getChoices() != null && !groqResponse.getChoices().isEmpty()) {
                    return groqResponse.getChoices().get(0).getMessage().getContent();
                }
            }

            return "Sorry, I couldn't generate a response at this time.";

        } catch (Exception e) {
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }

    // Inner classes for JSON mapping
    public static class GroqRequest {
        private String model;
        private List<GroqMessage> messages;
        @JsonProperty("max_tokens")
        private Integer maxTokens;
        private Double temperature;

        // Getters and setters
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }

        public List<GroqMessage> getMessages() { return messages; }
        public void setMessages(List<GroqMessage> messages) { this.messages = messages; }

        public Integer getMaxTokens() { return maxTokens; }
        public void setMaxTokens(Integer maxTokens) { this.maxTokens = maxTokens; }

        public Double getTemperature() { return temperature; }
        public void setTemperature(Double temperature) { this.temperature = temperature; }
    }

    public static class GroqMessage {
        private String role;
        private String content;

        public GroqMessage() {}

        public GroqMessage(String role, String content) {
            this.role = role;
            this.content = content;
        }

        // Getters and setters
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }

    public static class GroqResponse {
        private List<GroqChoice> choices;

        public List<GroqChoice> getChoices() { return choices; }
        public void setChoices(List<GroqChoice> choices) { this.choices = choices; }
    }

    public static class GroqChoice {
        private GroqMessage message;

        public GroqMessage getMessage() { return message; }
        public void setMessage(GroqMessage message) { this.message = message; }
    }
}