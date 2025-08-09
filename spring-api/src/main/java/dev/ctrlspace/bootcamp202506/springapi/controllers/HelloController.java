package dev.ctrlspace.bootcamp202506.springapi.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {



    // http://localhost:8080/hello?q=java+spring+boot+hello+world+example
    @GetMapping("/hello")
    public String hello(@RequestParam(required=false) String name) {


        String pageContent = """
                             <h1>Hello, ${name}</h1>
                             <p>Welcome to the Spring Boot application.</p>
                             <ul>
                                 <li><a href="/hello/bootcamp">Bootcamp Greeting</a></li>
                                 <li><a href="/hello?q=java+spring+boot+hello+world+example">Query Example</a></li>
                                 <li><a href="/hello?name=John">Personalized Greeting</a></li>
                             </ul>
                             """;

        String greetingName = "World!";

        if (name != null) {
            greetingName = name;
        }


        return pageContent.replace("${name}", greetingName);
    }

    @GetMapping("/hello/bootcamp")
    public String helloBootcamp() {
        return "Hello, Bootcamp!";
    }

}
