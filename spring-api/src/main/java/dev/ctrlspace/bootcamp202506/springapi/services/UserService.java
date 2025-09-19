package dev.ctrlspace.bootcamp202506.springapi.services;

import dev.ctrlspace.bootcamp202506.springapi.exceptions.BootcampException;
import dev.ctrlspace.bootcamp202506.springapi.models.User;
import dev.ctrlspace.bootcamp202506.springapi.models.dtos.JwtDTO;
import dev.ctrlspace.bootcamp202506.springapi.repositories.ChatRepository;
import dev.ctrlspace.bootcamp202506.springapi.repositories.MessageRepository;
import dev.ctrlspace.bootcamp202506.springapi.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    Logger logger = LoggerFactory.getLogger(UserService.class);

    private UserRepository userRepository;
    private JwtEncoder jwtEncoder;
    private PasswordEncoder passwordEncoder;
    private ChatRepository chatRepository;
    private MessageRepository messageRepository;

    @Autowired
    public UserService(UserRepository userRepository, JwtEncoder jwtEncoder,
                       PasswordEncoder passwordEncoder, ChatRepository chatRepository,
                       MessageRepository messageRepository) {
        this.userRepository = userRepository;
        this.jwtEncoder = jwtEncoder;
        this.passwordEncoder = passwordEncoder;
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
        logger.debug("UserService initialized with UserRepository. Reference to:" + this);
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User getUserByUsername(String username) {
        return userRepository.findUserByUsername(username);
    }

    public User createUser(User user) throws BootcampException {
        // Validate that user with the same username does not exist
        User existingUser = userRepository.findUserByUsername(user.getUsername());
        if (existingUser != null) {
            throw new BootcampException(HttpStatus.BAD_REQUEST, "User with username " + user.getUsername() + " already exists.");
        }

        // Check if email already exists
        User existingUserByEmail = userRepository.findByEmail(user.getEmail());
        if (existingUserByEmail != null) {
            throw new BootcampException(HttpStatus.BAD_REQUEST, "User with email " + user.getEmail() + " already exists.");
        }

        // Set default role if not provided
        if (user.getRole() == null || user.getRole().trim().isEmpty()) {
            user.setRole("SIMPLE_USER");
        }

        // Ensure role has proper prefix
        if (!user.getRole().startsWith("ROLE_")) {
            if ("SIMPLE_USER".equals(user.getRole())) {
                user.setRole("ROLE_USER");
            } else if ("ADMINISTRATOR_USER".equals(user.getRole())) {
                user.setRole("ROLE_ADMIN");
            } else {
                user.setRole("ROLE_" + user.getRole().toUpperCase());
            }
        }

        user = userRepository.save(user);
        return user;
    }

    // Update user profile
    public User updateUser(Long userId, User updatedUserData) throws BootcampException {
        // Find existing user
        Optional<User> existingUserOpt = userRepository.findById(userId);
        if (!existingUserOpt.isPresent()) {
            throw new BootcampException(HttpStatus.NOT_FOUND, "User not found with id: " + userId);
        }

        User existingUser = existingUserOpt.get();

        // Check if new username is taken by another user
        if (updatedUserData.getUsername() != null && !updatedUserData.getUsername().equals(existingUser.getUsername())) {
            User userWithSameUsername = userRepository.findUserByUsername(updatedUserData.getUsername());
            if (userWithSameUsername != null && !userWithSameUsername.getId().equals(userId)) {
                throw new BootcampException(HttpStatus.CONFLICT, "Username " + updatedUserData.getUsername() + " is already taken.");
            }
        }

        // Check if new email is taken by another user
        if (updatedUserData.getEmail() != null && !updatedUserData.getEmail().equals(existingUser.getEmail())) {
            User userWithSameEmail = userRepository.findByEmail(updatedUserData.getEmail());
            if (userWithSameEmail != null && !userWithSameEmail.getId().equals(userId)) {
                throw new BootcampException(HttpStatus.CONFLICT, "Email " + updatedUserData.getEmail() + " is already taken.");
            }
        }

        // Update fields
        if (updatedUserData.getName() != null && !updatedUserData.getName().trim().isEmpty()) {
            existingUser.setName(updatedUserData.getName().trim());
        }

        if (updatedUserData.getUsername() != null && !updatedUserData.getUsername().trim().isEmpty()) {
            existingUser.setUsername(updatedUserData.getUsername().trim());
        }

        if (updatedUserData.getEmail() != null && !updatedUserData.getEmail().trim().isEmpty()) {
            existingUser.setEmail(updatedUserData.getEmail().trim());
        }

        // Don't update password here unless explicitly handling it
        // Don't update role unless it's an admin operation

        return userRepository.save(existingUser);
    }

    // Change user password
    public void changePassword(Long userId, String currentPassword, String newPassword) throws BootcampException {
        // Find existing user
        Optional<User> existingUserOpt = userRepository.findById(userId);
        if (!existingUserOpt.isPresent()) {
            throw new BootcampException(HttpStatus.NOT_FOUND, "User not found with id: " + userId);
        }

        User existingUser = existingUserOpt.get();

        // Verify current password
        if (!passwordEncoder.matches(currentPassword, existingUser.getPassword())) {
            throw new BootcampException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }

        // Check that new password is different
        if (passwordEncoder.matches(newPassword, existingUser.getPassword())) {
            throw new BootcampException(HttpStatus.BAD_REQUEST, "New password must be different from current password.");
        }

        // Validate new password length
        if (newPassword.length() < 6) {
            throw new BootcampException(HttpStatus.BAD_REQUEST, "New password must be at least 6 characters long.");
        }

        // Update password
        existingUser.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(existingUser);

        logger.info("Password changed successfully for user: " + existingUser.getUsername());
    }

    // Delete user account and all associated data
    @Transactional
    public void deleteUser(Long userId) throws BootcampException {
        // Find existing user
        Optional<User> existingUserOpt = userRepository.findById(userId);
        if (!existingUserOpt.isPresent()) {
            throw new BootcampException(HttpStatus.NOT_FOUND, "User not found with id: " + userId);
        }

        User existingUser = existingUserOpt.get();

        try {
            // Delete all messages in user's chats first
            // Find all chats belonging to this user
            List<dev.ctrlspace.bootcamp202506.springapi.models.Chat> userChats = chatRepository.findAll(userId, null, null, null);

            for (dev.ctrlspace.bootcamp202506.springapi.models.Chat chat : userChats) {
                // Delete all messages in each chat
                messageRepository.deleteByChatId(chat.getId());
            }

            // Delete all chats belonging to this user
            for (dev.ctrlspace.bootcamp202506.springapi.models.Chat chat : userChats) {
                chatRepository.delete(chat);
            }

            // Finally, delete the user
            userRepository.delete(existingUser);

            logger.info("User account deleted successfully: " + existingUser.getUsername());

        } catch (Exception e) {
            logger.error("Error deleting user account: " + e.getMessage(), e);
            throw new BootcampException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to delete user account: " + e.getMessage());
        }
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = getUserByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found: " + username);
        }
        return user;
    }

    public User getLoggedInUser(Authentication authentication) throws BootcampException {
        User loggedInUser;

        if (authentication.getPrincipal() instanceof User) {
            loggedInUser = (User) authentication.getPrincipal();
        } else if (authentication.getPrincipal() instanceof Jwt) {
            loggedInUser = this.getUserByUsername(((Jwt) authentication.getPrincipal()).getSubject());
        } else {
            throw new BootcampException(HttpStatus.UNAUTHORIZED, "You are not authenticated.");
        }

        if (loggedInUser == null) {
            throw new BootcampException(HttpStatus.UNAUTHORIZED, "User not found.");
        }

        return loggedInUser;
    }

    public JwtDTO generateJwtForAuthUser(Authentication authentication) throws BootcampException {
        User loggedInUser = (User) authentication.getPrincipal();

        Instant now = Instant.now();

        JwtClaimsSet claimsSet = JwtClaimsSet.builder()
                .issuer("localhost:8080")
                .subject(loggedInUser.getUsername())
                .issuedAt(now)
                .expiresAt(now.plus(1, ChronoUnit.HOURS))
                .claim("role", loggedInUser.getRole())
                .claim("email", loggedInUser.getEmail())
                .claim("name", loggedInUser.getName())
                .claim("id", loggedInUser.getId())
                .build();

        Jwt jwt = jwtEncoder.encode(JwtEncoderParameters.from(claimsSet));

        JwtDTO jwtDTO = new JwtDTO();
        jwtDTO.setToken(jwt.getTokenValue());
        return jwtDTO;
    }
}