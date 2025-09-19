package dev.ctrlspace.bootcamp202506.springapi.services;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

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

            // Log the request body for debugging
            System.out.println("Request body sent to Groq: " + requestBody);

            // Create HTTP entity
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            // Make the API call
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            // Log the raw response for debugging
            System.out.println("Raw API response: " + response.getBody());

            // Parse response using JsonNode for robustness
            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode choices = root.path("choices");
                if (!choices.isEmpty()) {
                    JsonNode message = choices.get(0).path("message");
                    String content = message.path("content").asText(null);
                    if (content != null) {
                        return content;
                    }
                }
            }

            return "Sorry, I couldn't generate a response at this time.";

        } catch (Exception e) {
            System.err.println("Error in getCompletion: " + e.getMessage());
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }

    // Inner classes with proper annotations
    public static class GroqRequest {
        private String model;
        private List<GroqMessage> messages;
        @JsonProperty("max_tokens")
        private Integer maxTokens;
        private Double temperature;

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

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}