package dev.ctrlspace.bootcamp202506.springapi.services;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.URL;
import java.io.OutputStream;
import java.io.InputStream;
import java.util.List;
import java.util.Scanner;

@Service
public class CompletionsApiService {

    @Value("${llms.groq.key}")
    private String groqApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getCompletion(String prompt) {
        try {
            URL url = new URL("https://api.groq.com/openai/v1/chat/completions");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + groqApiKey);
            conn.setDoOutput(true);

            // JSON request body
            String requestBody = """
                    {
                        "model": "llama-3.1-8b-instant",
                        "messages": [
                            {"role": "user", "content": "%s"}
                        ]
                    }
                    """.formatted(prompt);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(requestBody.getBytes());
                os.flush();
            }

            int responseCode = conn.getResponseCode();
            InputStream is = responseCode == 200 ? conn.getInputStream() : conn.getErrorStream();

            try (Scanner scanner = new Scanner(is)) {
                StringBuilder sb = new StringBuilder();
                while (scanner.hasNextLine()) {
                    sb.append(scanner.nextLine());
                }

                String jsonResponse = sb.toString();
                GroqResponse response = objectMapper.readValue(jsonResponse, GroqResponse.class);

                // return the AI's content
                if (response.getChoices() != null && !response.getChoices().isEmpty()) {
                    return response.getChoices().get(0).getMessage().getContent();
                } else {
                    return "No response from AI.";
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "Error contacting AI: " + e.getMessage();
        }
    }

    // ====================== Response Classes ======================

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GroqResponse {
        private String id;
        private List<GroqChoice> choices;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public List<GroqChoice> getChoices() { return choices; }
        public void setChoices(List<GroqChoice> choices) { this.choices = choices; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GroqChoice {
        private GroqMessage message;

        public GroqMessage getMessage() { return message; }
        public void setMessage(GroqMessage message) { this.message = message; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
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
