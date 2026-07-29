package com.kata.kt23;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

import java.util.Map;

public class ApiClient {
  private final String baseUrl;
  private final String token;

  public ApiClient(String baseUrl, String token) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  public Response get(String path) {
    return RestAssured.given()
        .baseUri(baseUrl)
        .header("Authorization", "Bearer " + token)
        .accept(ContentType.JSON)
        .when()
        .get(path);
  }

  public Response post(String path, Map<String, Object> body, int expectedStatus) {
    return RestAssured.given()
        .baseUri(baseUrl)
        .header("Authorization", "Bearer " + token)
        .contentType(ContentType.JSON)
        .accept(ContentType.JSON)
        .body(body)
        .when()
        .post(path)
        .then()
        .statusCode(expectedStatus)
        .extract().response();
  }

  public Response postNoBody(String path, int expectedStatus) {
    return RestAssured.given()
        .baseUri(baseUrl)
        .header("Authorization", "Bearer " + token)
        .accept(ContentType.JSON)
        .when()
        .post(path)
        .then()
        .statusCode(expectedStatus)
        .extract().response();
  }

  public Response delete(String path, int expectedStatus) {
    return RestAssured.given()
        .baseUri(baseUrl)
        .header("Authorization", "Bearer " + token)
        .accept(ContentType.JSON)
        .when()
        .delete(path)
        .then()
        .statusCode(expectedStatus)
        .extract().response();
  }
}
