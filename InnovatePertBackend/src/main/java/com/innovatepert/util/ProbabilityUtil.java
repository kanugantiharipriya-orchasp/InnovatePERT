package com.innovatepert.util;

public class ProbabilityUtil {

    private ProbabilityUtil() {
    }

    public static double cumulativeProbability(double z) {

        double t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));

        double d = 0.3989423 * Math.exp(-z * z / 2);

        double probability = d * t *
                (0.3193815 +
                t * (-0.3565638 +
                t * (1.781478 +
                t * (-1.821256 +
                t * 1.330274))));

        probability = 1 - probability;

        if (z < 0) {
            probability = 1 - probability;
        }

        return probability * 100;
    }

}