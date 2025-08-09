package dev.ctrlspace.bootcamp202506.springapi.models.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JwtDTO { // Pojo

    private String token;
}
