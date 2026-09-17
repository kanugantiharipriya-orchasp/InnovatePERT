package com.innovatepert.exception;

public class BadRequestException extends RuntimeException { // Must extend RuntimeException!
    public BadRequestException(String message) {
        super(message);
    }
}