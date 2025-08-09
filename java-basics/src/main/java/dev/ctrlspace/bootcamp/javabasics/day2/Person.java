package dev.ctrlspace.bootcamp.javabasics.day2;

public class Person {


    private String name;
    private int year;
    private double height;
    private double weight;

    public Person() {
    }

    public Person(String name, int year, double height) {
        this.name = name;
        this.year = year;
        this.height = height;
    }

    public Person(int year) {
        this.year = year;
        this.height = 0;
        this.name = null;
    }


    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }


    public double getHeight() {
        return height;
    }

    public void setHeight(double height) {
        this.height = height;
    }

    public double getWeight() {
        return weight;
    }

    public void setWeight(double weight) {
        this.weight = weight;
    }

    public double massIndex() {
        if (height == 0) {
            return 0; // Avoid division by zero
        }
        return weight / (height * height);
    }

    public String toString() {
        return "Person{" +
                "name='" + name + '\'' +
                ", year=" + year +
                ", height=" + height +
                ", weight=" + weight +
                '}';
    }

}
