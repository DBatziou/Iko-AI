package dev.ctrlspace.bootcamp.javabasics.day3;

public class Lion extends Animal implements Roarable {

    public Lion() {
        super.name = null;
        super.hungerLevel = 0;
    }

    public Lion(String name, int hungerLevel) {
        super.name = name;
        super.hungerLevel = hungerLevel;
    }

    public void roar() {
        System.out.println("Roar! Roar!");
    }


    public void eatMeat() {
        hungerLevel = hungerLevel - 10;
    }
}
