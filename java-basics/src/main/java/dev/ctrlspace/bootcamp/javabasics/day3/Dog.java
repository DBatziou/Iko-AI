package dev.ctrlspace.bootcamp.javabasics.day3;

public class Dog extends Animal implements Roarable {

    private String breed;

    public Dog() {
        super();
    }

    public Dog(String name, int hungerLevel, String breed) {
        super(name, hungerLevel);
        this.breed = breed;
    }

    public void roar() {
        System.out.println("Woof! Woof!");
    }

    public void eatMeat() {
        hungerLevel = hungerLevel -10;
    }

    public void eatGrass() {
        hungerLevel = hungerLevel - 5;
    }

}


