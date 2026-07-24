package com.kata.taskmanager;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.response.Response;

import java.util.Map;

public class ApiClient {
  private final String baseUrl;

  public ApiClient(String baseUrl) {
    this.baseUrl = baseUrl;
  }

  public String loginAndGetToken(String username, String password) {
    Response res = RestAssured.given()
        .baseUri(baseUrl)
        .contentType(ContentType.JSON)
        .body(Map.of("username", username, "password", password))
        .when()
        .post("/api/auth/login")
        .then()
        .statusCode(200)
        .extract().response();

    return res.jsonPath().getString("data.token");
  }

  public Response createTask(String token, Map<String, Object> payload) {
    return RestAssured.given()
        .baseUri(baseUrl)
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(payload)
        .when()
        .post("/api/tasks");
  }

  public Response getTask(String token, String id) {
    return RestAssured.given()
        .baseUri(baseUrl)
        .header("Authorization", "Bearer " + token)
        .when()
        .get("/api/tasks/{id}", id);
  }

  public Response patchTaskStatus(String token, String id, Map<String, Object> payload) {
    return RestAssured.given()
        .baseUri(baseUrl)
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(payload)
        .when()
        .patch("/api/tasks/{id}/status", id);
  }

  public Response deleteTask(String token, String id) {
    return RestAssured.given()
        .baseUri(baseUrl)
        .header("Authorization", "Bearer " + token)
        .when()
        .delete("/api/tasks/{id}", id);
  }
}
