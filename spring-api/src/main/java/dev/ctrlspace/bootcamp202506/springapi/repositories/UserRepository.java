package dev.ctrlspace.bootcamp202506.springapi.repositories;

import dev.ctrlspace.bootcamp202506.springapi.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    @Query(nativeQuery = true,
            value = "SELECT * FROM public.users WHERE username = :username")
    public User findUserByUsername(@Param("username") String username);

    User findByUsername(String username);

    User findByEmail(String email);

    User findByUsernameAndPassword(String username, String password);

}
