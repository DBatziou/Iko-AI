package dev.ctrlspace.bootcamp202506.springapi.services;

public class MySingleton {
    private static MySingleton instance;

    private MySingleton() {
        // Private constructor to prevent instantiation
    }

    public static MySingleton getInstance() {
        if (instance == null) {
            instance = new MySingleton();
        }
        return instance;
    }
}