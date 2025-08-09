package dev.ctrlspace.bootcamp.javabasics.day3;

import java.util.HashMap;
import java.util.Map;
import java.util.PriorityQueue;
import java.util.ServiceLoader;

public class SimulationRunner {


    private static Map<String, Simulation> simulations = new HashMap<>();


    public static void main(String[] args) {


        ServiceLoader<Simulation> loader =
                ServiceLoader.load(Simulation.class);

        // for all instances of Simulation interface (AnimalSimulationWithInheritance, AnimalSimulationWithoutInheritance)
        for (Simulation simulation : loader) {
            // you get an instance already constructed
            simulations.put(simulation.getName(), simulation);
        }

        String simulationNameParam;
        // String simulationNameParam = (args.length == 1) ? args[0] : "with-inheritance"
        if (args.length == 1) {
            simulationNameParam = args[0];
        } else {
            simulationNameParam = "with-inheritance";
        }

        Simulation simulation = simulations.get(simulationNameParam);

        simulation.initialize();
        simulation.simulate();

        //        String simulationNameParam = (args.length == 1) ? args[0] : "with-inheritance";
//        Tightly coupled code because of hardcoded class names
//        switch (simulationNameParam) {
//            case "without-inheritance":
//                simulation = new AnimalSimulationWithoutInheritance();
//                break;
//            case "with-inheritance":
//            default:
//                simulation = new AnimalSimulationWithInheritance();
//                break;
//        }
//        simulation.initialize();
//        simulation.simulate();


    }


}

