package dev.ctrlspace.bootcamp202506.springapi.services;

import dev.ctrlspace.bootcamp202506.springapi.exceptions.BootcampException;
import dev.ctrlspace.bootcamp202506.springapi.models.User;
import dev.ctrlspace.bootcamp202506.springapi.models.dtos.JwtDTO;
import dev.ctrlspace.bootcamp202506.springapi.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
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
import org.springframework.web.context.WebApplicationContext;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class UserService implements UserDetailsService {

    Logger logger = LoggerFactory.getLogger(UserService.class);

    private UserRepository userRepository;

    private JwtEncoder jwtEncoder;

    @Autowired
    public UserService(UserRepository userRepository,
                       JwtEncoder jwtEncoder) {
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
        //validate that user with the same username does not exist
        User existingUser = userRepository.findUserByUsername(user.getUsername());
        if (existingUser != null) {
            throw new BootcampException(HttpStatus.BAD_REQUEST, "User with username " + user.getUsername() + " already exists.");
        }

        user = userRepository.save(user);
        return user;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = getUserByUsername(username);

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

        return loggedInUser;
    }


    public JwtDTO generateJwtForAuthUser(Authentication authentication) {
        User logedInUser = (User) authentication.getPrincipal();

        Instant now = Instant.now();

        JwtClaimsSet claimsSet = JwtClaimsSet.builder()
                .issuer("localhost:8080")
                .subject(logedInUser.getUsername())
                .issuedAt(now)
                .expiresAt(now.plus(1, ChronoUnit.HOURS))
                .claim("role", logedInUser.getRole())
                .claim("email", logedInUser.getEmail())
                .claim("name", logedInUser.getName())
                .claim("id", logedInUser.getId())
                .build();

        Jwt jwt = jwtEncoder.encode(JwtEncoderParameters.from(claimsSet));


        JwtDTO jwtDTO = new JwtDTO();
        jwtDTO.setToken(jwt.getTokenValue());
        return jwtDTO;
    }
}
