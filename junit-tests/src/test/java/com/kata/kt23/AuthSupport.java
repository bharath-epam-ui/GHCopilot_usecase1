package com.kata.kt23;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;

import static org.junit.jupiter.api.Assertions.*;

public final class AuthSupport {
  private AuthSupport() {}

  public static String loginAndGetToken(String baseUrl, String username, String password) {
    // Assumes app exposes POST /api/auth/login with {username,password} and returns {token: "..."} or {data:{token:"..."}}
    var resp = RestAssured.given()
        .baseUri(baseUrl)
        .contentType(ContentType.JSON)
        .accept(ContentType.JSON)
        .body(new LoginRequest(username, password))
        .when()
        .post("/api/auth/login");

    assertEquals(200, resp.statusCode(), "login should succeed");

    String token = resp.jsonPath().getString("token");
    if (token == null) token = resp.jsonPath().getString("data.token");
    if (token == null) token = resp.jsonPath().getString("data.accessToken");

    assertNotNull(token, "token should be present in login response");
    assertFalse(token.isBlank(), "token should not be blank");
    return token;
  }

  public record LoginRequest(String username, String password) {}
}
