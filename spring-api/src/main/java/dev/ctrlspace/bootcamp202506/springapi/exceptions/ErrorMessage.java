package dev.ctrlspace.bootcamp202506.springapi.exceptions;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ErrorMessage {

    private String errorMessage;
    private int errorCode;

}
