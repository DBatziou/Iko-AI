package dev.ctrlspace.bootcamp.javabasics.day3;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Random;

public class AnimalSimulationWithoutInheritance implements Simulation {



    private List<Dog> dogs = new ArrayList<>();
    private List<Lion> lions = new ArrayList<>();
    private List<Sheep> sheeps = new LinkedList<>();


    public AnimalSimulationWithoutInheritance() {
    }

    public void initialize() {

        Random random = new Random();

        int totalDogs = random.nextInt(10) + 1; // [0, 10) + 1 -> [1, 11) -> [1, 10]
//        int totalDogs = random.nextInt(11); // [0, 11) -> [0, 10]
        int totalLions = random.nextInt(10) + 1;
        int totalSheeps = random.nextInt(10) + 1;

        for (int i = 0; i < totalDogs; i++) {
            Dog dog = new Dog("Dog" + (i + 1), random.nextInt(100), null); // [0, 99]

//            Dog dog = new Dog();
//            dog.setName("Dog" + (i + 1));
//            dog.setHungerLevel(random.nextInt(100)); // [0, 99]

            dogs.add(dog);
        }

        for (int i = 0; i < totalLions; i++) {
            lions.add(new Lion("Lion" + (i + 1), random.nextInt(100)));
        }

        for (int i = 0; i < totalSheeps; i++) {
            sheeps.add(new Sheep("Sheep" + (i + 1), random.nextInt(100)));
        }

        System.out.println("Simulation initialized: ");
        System.out.println("Total dogs: " + totalDogs);
        System.out.println("Total lions: " + totalLions);
        System.out.println("Total sheeps: " + totalSheeps);
        System.out.println("--------------------------------");

    }



    public void simulate() {

        Random random = new Random();

        int totalDays = 10;

        System.out.println("Simulating starting for " + totalDays + " days...");


        for (int i = 0; i < totalDays; i++) {

            System.out.println("Day #" + (i + 1) + " of simulation, started...");

//            int x = (int)Math.random() * 100; // [0, 1) -> 0.2452245454215 -> 24.52245454215 - cast to int -> 24

            // for each dog, in dogs list....
            for (Dog dog : dogs) {
                dog.setHungerLevel(dog.getHungerLevel() + 1);

                int roarChance = random.nextInt(100); // [0, 9]

                if (roarChance < 10) {
                    System.out.println("Dog name " + dog.getName());
                    dog.roar();
                }
            }


            for (Lion lion : lions) {
                lion.setHungerLevel(lion.getHungerLevel() + 1);

                int roarChance = random.nextInt(100); // [0, 9]

                if (roarChance < 20) {
                    System.out.println("Lion name " + lion.getName());
                    lion.roar();
                }
            }



            for (Sheep sheep : sheeps) {
                sheep.setHungerLevel(sheep.getHungerLevel() + 1);

                int bleatChance = random.nextInt(100); // [0, 9]

                if (bleatChance < 30) {
                    System.out.println("Sheep name " + sheep.getName());
                    sheep.roar();
                }
            }

            System.out.println("Day #" + (i + 1) + " of simulation, finished!");

        }


        System.out.println("Simulation finished!");

    }


    public String getName() {
        return "without-inheritance";
    }


}
