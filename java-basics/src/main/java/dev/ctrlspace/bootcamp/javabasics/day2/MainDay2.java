package dev.ctrlspace.bootcamp.javabasics.day2;


public class MainDay2 {


    public static void main(String[] args) {
        System.out.println("Hello World!");

        int x = 5;

        if (x > 0) {
            System.out.println("x is positive");
        } else if (x < 0) {
            System.out.println("x is negative");
        } else {
            System.out.println("x is zero");
        }

        // for loop to print numbers from 0 to 4
        for (int i = 0; i < 5; i++) {
            System.out.println("i is: " + i);
        }

        // initializing an array inline
        int[] numbers = {1, 2, 3, 4, 5};
        // initializing an array with a loop
        int[] numbers2 = new int[5];
        for (int i = 0; i < numbers2.length; i++) {
            numbers2[i] = numbers[i] * 2;
        }


        // printing the arrays
        for (int i = 0; i < numbers2.length; i++) {
            System.out.print("numbers[" + i +"] = " + numbers[i]);
            System.out.println(" || numbers2[" + i +"] = " + numbers2[i]);
        }


        String s = "Hello";


        Person p = new Person();
        p.setName("Chris");
        p.setYear(1992);
        p.setHeight(1.93);

        System.out.println("Person name: " + p.getName());
        System.out.println("Person year: " + p.getYear());
        System.out.println("Person height: " + p.getHeight() + "m");


        Person p2 = new Person("John", 1990, 1.80);

        Person baby = new Person(2025);

        System.out.println("Person name: " + p2.toString());
        System.out.println("Person year: " + baby);



        int[] k = new int[5];
        Person[] people = new Person[5];

        for (int i = 0; i < people.length; i++) {
            k[i] = i * 10;
            people[i] = new Person("Person " + i, 2000 + i, 1.70 + i * 0.1);
        }


        for (int i = 0; i < people.length; i++) {
            System.out.println("people[" + i + "] = " + people[i]);
        }

    }

}
