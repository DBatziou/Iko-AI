package dev.ctrlspace.bootcamp.javabasics.day3;

public class Sheep extends Animal implements Roarable {



    public Sheep() {
        super.name = null;
        super.hungerLevel = 0;
    }

    public Sheep(String name, int hungerLevel) {
        super.name = name;
        super.hungerLevel = hungerLevel;
    }

    public void roar() {
        System.out.println("Bee! Bee!");
    }


    public void eatGrass() {
        hungerLevel = hungerLevel - 5;
    }
}
