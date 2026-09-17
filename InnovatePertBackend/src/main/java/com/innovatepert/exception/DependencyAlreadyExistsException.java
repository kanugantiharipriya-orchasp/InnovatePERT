package com.innovatepert.exception;

public class DependencyAlreadyExistsException extends RuntimeException {

    public DependencyAlreadyExistsException(String message) {
        super(message);
    }
}