package dev.ctrlspace.bootcamp202506.springapi.repositories;

import dev.ctrlspace.bootcamp202506.springapi.models.Chat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

public interface ChatRepository extends JpaRepository<Chat, Long> {
//JpaRepository<Chat, Long> gives you standard CRUD operations automatically:
//
//save(), findById(), findAll(), delete(), etc.
    @Query(nativeQuery = true,
            value = "SELECT c.* " +
                    "FROM public.chats c " +
                    "   inner join public.users u on c.user_id = u.id " +
                    "WHERE (:userId is null or user_id = :userId) AND " +
                    "   (:username is null or u.username = :username) and " +
                    "   (CAST(:from AS timestamp) is null or created_at >= :from) AND " +
                    "   (CAST(:to AS timestamp) is null or created_at <= :to) ")
    //@Query(nativeQuery = true, ...) → This uses raw SQL, not JPQL.
    //
    //c.* → Select all columns of the chats table.
    //
    //inner join public.users u on c.user_id = u.id → Joins chats with users so you can filter by username.
    //
    //Dynamic filters with :param:
    //
    //:userId → Only filter by user ID if it’s not null.
    //
    //:username → Only filter by username if it’s not null.
    //
    //:from → Only get chats created after this timestamp, if provided.
    //
    //:to → Only get chats created before this timestamp, if provided.
    List<Chat> findAll(Long userId,
                       String username,
                       Instant from,
                       Instant to);


    // same as above with JPA:
//    @Query("SELECT c FROM Chat c " +
//            "  JOIN c.user u " +
//            "WHERE (:userId is null or c.user.id = :userId) AND " +
//            "  (:username is null or u.username = :username) AND " +
//            "  (CAST(:from AS timestamp) is null or c.createdAt >= :from) AND " +
//            "  (CAST(:to AS timestamp) is null or c.createdAt <= :to)")
//    List<Chat> findAllWithJPA(Long userId,
//                       String username,
//                       Instant from,
//                       Instant to);







//    T or T -> true
//    T or F -> true
//    F or T -> true
//    F or F -> false

}
