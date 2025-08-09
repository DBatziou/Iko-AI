package dev.ctrlspace.bootcamp.javabasics.day3;

public class FakeSimulation implements Simulation{

    public void initialize() {

        System.out.println("Initiating Fake simulation");
    }


    public void simulate() {

        System.out.println("Running Fake simulation");
    }

    public String getName() {
        return "test-simulation";
    }
}
