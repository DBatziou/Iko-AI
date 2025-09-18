package dev.ctrlspace.bootcamp202506.springapi.controllers;

import dev.ctrlspace.bootcamp202506.springapi.exceptions.BootcampException;
import dev.ctrlspace.bootcamp202506.springapi.models.User;
import dev.ctrlspace.bootcamp202506.springapi.models.dtos.JwtDTO;
import dev.ctrlspace.bootcamp202506.springapi.services.MySingleton;
import dev.ctrlspace.bootcamp202506.springapi.services.UserService;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class UserController {

    Logger logger = org.slf4j.LoggerFactory.getLogger(UserController.class);

    private UserService userService;
    private JwtEncoder jwtEncoder;

    @Autowired
    public UserController(UserService userService, JwtEncoder jwtEncoder) {
        this.userService = userService;
        this.jwtEncoder = jwtEncoder;

        logger.debug("UserController initialized with UserService: " + userService);
        MySingleton mySingleton = MySingleton.getInstance();
        MySingleton mySingleton2 = MySingleton.getInstance();
    }

    public UserController() {
    }

    @GetMapping("/users")
    public List<User> getAllUsers(Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);

        if (!loggedInUser.getRole().equals("ROLE_ADMIN")) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You are not allowed to access this resource.");
        }

        return userService.getAll();
    }

    @GetMapping("/users/{username}")
    public User getUserByUserName(@PathVariable String username, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);

        boolean isAdmin = "ROLE_ADMIN".equals(loggedInUser.getRole());
        boolean isSelf = username.equals(loggedInUser.getUsername());

        if (!(isAdmin || isSelf)) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You are not allowed to access this resource.");
        }

        return userService.getUserByUsername(username);
    }

    @GetMapping("/login")
    public JwtDTO login(Authentication authentication) throws BootcampException {
        JwtDTO jwtDTO = userService.generateJwtForAuthUser(authentication);
        return jwtDTO;
    }

    @PostMapping("/users")
    public User createUser(@RequestBody User user) throws BootcampException {
        return userService.createUser(user);
    }

    // Add this endpoint for checking username availability
    @GetMapping("/check-username/{username}")
    public boolean checkUsernameExists(@PathVariable String username) {
        User existingUser = userService.getUserByUsername(username);
        return existingUser != null;
    }

    // Add this endpoint to get current user info from token
    @GetMapping("/me")
    public User getCurrentUser(Authentication authentication) throws BootcampException {
        return userService.getLoggedInUser(authentication);
    }
}