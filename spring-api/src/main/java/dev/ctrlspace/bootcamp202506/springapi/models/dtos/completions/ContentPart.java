package dev.ctrlspace.bootcamp202506.springapi.models.dtos.completions;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContentPart {


    private String type;
    private String text;

}
