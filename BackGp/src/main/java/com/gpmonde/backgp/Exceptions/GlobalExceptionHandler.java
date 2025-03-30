package com.gpmonde.backgp.Exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(AgenceOrProgrammeGpNotFoundException.class)
	public ErrorResponse handleAgenceOrProgrammeNotFoundException(AgenceOrProgrammeGpNotFoundException ex) {
		String message;
		if ("AGENCE_NOT_FOUND".equals(ex.getErrorCode())) {
			message = String.format(ErrorMessages.AGENCE_NOT_FOUND, ex.getMessage());
		} else {
			message = String.format(ErrorMessages.PROGRAMMEGP_NOT_FOUND, ex.getMessage());
		}

		ErrorResponse errorResponse = new ErrorResponse(ex.getErrorCode(), message);
		return errorResponse;
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ErrorResponse handleIllegalArgumentException(IllegalArgumentException ex) {
		ErrorResponse errorResponse = new ErrorResponse("ILLEGAL_ARGUMENT",
				String.format(ErrorMessages.ILLEGAL_ARGUMENT, ex.getMessage()));
		return errorResponse;
	}

	@ExceptionHandler(UserAlreadyExistsException.class)
	public ResponseEntity<ErrorResponse> handleUserAlreadyExistsException(UserAlreadyExistsException ex) {
		ErrorResponse errorResponse = new ErrorResponse(
				"USER_ALREADY_EXISTS",
				ex.getMessage()
		);
		return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
	}

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ErrorResponse> handleBadCredentialsException(BadCredentialsException ex) {
		ErrorResponse errorResponse = new ErrorResponse(
				"BAD_CREDENTIALS",
				ex.getMessage()
		);
		return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);}


		@ExceptionHandler(Exception.class)
	public ErrorResponse handleGenericException(Exception ex) {
		ErrorResponse errorResponse = new ErrorResponse("GENERIC_ERROR",
				String.format(ErrorMessages.GENERIC_ERROR, ex.getMessage()));
		return errorResponse;
	}
}

