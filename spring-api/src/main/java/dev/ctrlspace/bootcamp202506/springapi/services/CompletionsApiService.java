package dev.ctrlspace.bootcamp202506.springapi.services;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.ctrlspace.bootcamp202506.springapi.models.Message;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class CompletionsApiService {

    @Value("${llms.groq.key}")
    private String groqApiKey;

    @Value("${llms.groq.system-prompt}")
    private String systemPrompt;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Map of potentially deprecated models to current alternatives
    private final Map<String, String> modelMapping = Map.of(
            "mixtral-8x7b-32768", "llama-3.1-8b-instant",
            "gemma-7b-it", "gemma2-9b-it"
    );

    public CompletionsApiService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    // New method with conversation history
    public String getCompletionWithHistory(String model, List<Message> conversationHistory, String newUserMessage) {
        try {
            // Check if the requested model needs to be mapped to a current one
            String actualModel = modelMapping.getOrDefault(model, model);
            if (!actualModel.equals(model)) {
                System.out.println("Model " + model + " mapped to " + actualModel);
            }

            // Groq API endpoint
            String url = "https://api.groq.com/openai/v1/chat/completions";

            // Create headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(groqApiKey);

            // Build message history for the API
            List<GroqMessage> messages = new ArrayList<>();

            // Add system message first
            messages.add(new GroqMessage("system", systemPrompt));

            // Add conversation history (limit to last 20 messages to avoid token limits)
            int startIndex = Math.max(0, conversationHistory.size() - 20);
            for (int i = startIndex; i < conversationHistory.size(); i++) {
                Message msg = conversationHistory.get(i);
                String role = msg.getFromSelf() ? "user" : "assistant";
                messages.add(new GroqMessage(role, msg.getContent()));
            }

            // Add the new user message
            messages.add(new GroqMessage("user", newUserMessage));

            // Create request body
            GroqRequest request = new GroqRequest();
            request.setModel(actualModel);
            request.setMessages(messages);
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

        } catch (HttpClientErrorException e) {
            System.err.println("HTTP Error in getCompletionWithHistory: " + e.getStatusCode() + " - " + e.getResponseBodyAsString());

            // Handle specific model deprecation errors
            if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                try {
                    JsonNode errorResponse = objectMapper.readTree(e.getResponseBodyAsString());
                    String errorMessage = errorResponse.path("error").path("message").asText("");

                    if (errorMessage.contains("decommissioned") || errorMessage.contains("deprecated")) {
                        System.err.println("Model " + model + " is deprecated, falling back to default model");
                        // Fallback to default model
                        return getCompletionWithHistory("llama-3.1-8b-instant", conversationHistory, newUserMessage);
                    }
                } catch (Exception parseError) {
                    System.err.println("Error parsing error response: " + parseError.getMessage());
                }
            }

            return "Sorry, I encountered an error with the AI service. Please try again.";

        } catch (Exception e) {
            System.err.println("Error in getCompletionWithHistory: " + e.getMessage());
            e.printStackTrace();
            return "Error: " + e.getMessage();
        }
    }

    // Keep the old method for backwards compatibility
    public String getCompletion(String model, String userMessage) {
        return getCompletionWithHistory(model, new ArrayList<>(), userMessage);
    }

    // Inner classes remain the same
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