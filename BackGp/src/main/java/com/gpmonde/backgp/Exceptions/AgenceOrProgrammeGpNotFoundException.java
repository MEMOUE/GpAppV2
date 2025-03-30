package com.gpmonde.backgp.Exceptions;

public class AgenceOrProgrammeGpNotFoundException extends RuntimeException {
	private final String errorCode;

	public AgenceOrProgrammeGpNotFoundException(String errorCode, String message) {
		super(message);
		this.errorCode = errorCode;
	}

	public String getErrorCode() {
		return errorCode;
	}
}
