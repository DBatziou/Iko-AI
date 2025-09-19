package dev.ctrlspace.bootcamp202506.springapi.services;

import dev.ctrlspace.bootcamp202506.springapi.exceptions.BootcampException;
import dev.ctrlspace.bootcamp202506.springapi.models.User;
import dev.ctrlspace.bootcamp202506.springapi.models.dtos.JwtDTO;
import dev.ctrlspace.bootcamp202506.springapi.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    Logger logger = LoggerFactory.getLogger(UserService.class);

    private UserRepository userRepository;
    private JwtEncoder jwtEncoder;

    @Autowired
    public UserService(UserRepository userRepository, JwtEncoder jwtEncoder) {
        this.userRepository = userRepository;
        this.jwtEncoder = jwtEncoder;
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

    // NEW: Add updateUser method
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