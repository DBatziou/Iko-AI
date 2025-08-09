package dev.ctrlspace.bootcamp202506.springapi.exceptions;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class BootcampExceptionHandler {



    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorMessage> handleException(Exception e) {

        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        if (e instanceof BootcampException) {
            BootcampException bootcampException = (BootcampException) e;
            status = bootcampException.getHttpStatus();
        }

        e.printStackTrace();
        ErrorMessage errorMessage = new ErrorMessage();
        errorMessage.setErrorCode(status.value());
        errorMessage.setErrorMessage("Something went wrong: " + e.getMessage());


        return ResponseEntity.status(status).body(errorMessage);
    }

}
