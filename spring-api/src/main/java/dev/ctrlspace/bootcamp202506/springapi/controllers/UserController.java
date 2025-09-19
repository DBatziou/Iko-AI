package dev.ctrlspace.bootcamp202506.springapi.controllers;

import dev.ctrlspace.bootcamp202506.springapi.exceptions.BootcampException;
import dev.ctrlspace.bootcamp202506.springapi.models.User;
import dev.ctrlspace.bootcamp202506.springapi.models.dtos.JwtDTO;
import dev.ctrlspace.bootcamp202506.springapi.services.MySingleton;
import dev.ctrlspace.bootcamp202506.springapi.services.UserService;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    // Update user profile
    @PutMapping("/users/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User updatedUser, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);

        // Check if user is updating their own profile or is admin
        boolean isAdmin = "ROLE_ADMIN".equals(loggedInUser.getRole());
        boolean isSelf = id.equals(loggedInUser.getId());

        if (!(isAdmin || isSelf)) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You are not allowed to update this user.");
        }

        return userService.updateUser(id, updatedUser);
    }

    // NEW: Change user password
    @PutMapping("/users/{id}/password")
    public ResponseEntity<String> changePassword(@PathVariable Long id, @RequestBody Map<String, String> passwordData, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);

        // Check if user is updating their own password or is admin
        boolean isAdmin = "ROLE_ADMIN".equals(loggedInUser.getRole());
        boolean isSelf = id.equals(loggedInUser.getId());

        if (!(isAdmin || isSelf)) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You are not allowed to change this user's password.");
        }

        String currentPassword = passwordData.get("currentPassword");
        String newPassword = passwordData.get("newPassword");

        if (currentPassword == null || newPassword == null) {
            throw new BootcampException(HttpStatus.BAD_REQUEST, "Current password and new password are required.");
        }

        if (newPassword.length() < 6) {
            throw new BootcampException(HttpStatus.BAD_REQUEST, "New password must be at least 6 characters long.");
        }

        userService.changePassword(id, currentPassword, newPassword);

        return ResponseEntity.ok("Password updated successfully");
    }

    // NEW: Delete user account
    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id, Authentication authentication) throws BootcampException {
        User loggedInUser = userService.getLoggedInUser(authentication);

        // Check if user is deleting their own account or is admin
        boolean isAdmin = "ROLE_ADMIN".equals(loggedInUser.getRole());
        boolean isSelf = id.equals(loggedInUser.getId());

        if (!(isAdmin || isSelf)) {
            throw new BootcampException(HttpStatus.FORBIDDEN, "You are not allowed to delete this user.");
        }

        userService.deleteUser(id);

        return ResponseEntity.ok("User account deleted successfully");
    }

    // Check username availability
    @GetMapping("/check-username/{username}")
    public boolean checkUsernameExists(@PathVariable String username) {
        User existingUser = userService.getUserByUsername(username);
        return existingUser != null;
    }

    // Get current user info from token
    @GetMapping("/me")
    public User getCurrentUser(Authentication authentication) throws BootcampException {
        return userService.getLoggedInUser(authentication);
    }
}