package dev.ctrlspace.bootcamp202506.springapi.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BootcampException.class)
    public ResponseEntity<Map<String, Object>> handleBootcampException(
            BootcampException ex, WebRequest request) {

        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("message", ex.getMessage());
        errorDetails.put("status", ex.getHttpStatus().value());
        errorDetails.put("error", ex.getHttpStatus().getReasonPhrase());

        return new ResponseEntity<>(errorDetails, ex.getHttpStatus());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(
            Exception ex, WebRequest request) {

        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("message", ex.getMessage());
        errorDetails.put("status", 500);
        errorDetails.put("error", "Internal Server Error");

        return new ResponseEntity<>(errorDetails, org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("message", "Validation failed");
        errorDetails.put("status", 400);
        errorDetails.put("error", "Bad Request");
        // Optional: add field errors from ex.getBindingResult() if needed
        return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleJsonParseException(HttpMessageNotReadableException ex) {
        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("message", "Malformed JSON request");
        errorDetails.put("status", 400);
        errorDetails.put("error", "Bad Request");
        return new ResponseEntity<>(errorDetails, HttpStatus.BAD_REQUEST);
    }
}