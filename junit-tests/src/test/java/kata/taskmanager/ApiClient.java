package kata.taskmanager;

import io.rest-assured.RestAssured;
import io.rest-assured.http.ContentType;
import io.rest-assured.response.Response;
import java.util.Map;

public class ApiClient {
  public static String baseUrl() {
    return System.getProperty("baseUrl", "http://localhost:3000");
  }

  public static Response login(String username, String password) {
    return RestAssured.given()
        .contentType(ContentType.JSON)
        .body(Map.            of("username", username, "password", password))
        .when()
        .post(baseUrl() + "/api/auth/login");
  }

  public static Response createTask(String token, Map<String, ?> payload) {
    return RestAssured.given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(payload)
        .when()
        .post(baseUrl() + "/api/tasks");
  }

  public static Response updateTask(String token, String id, Map<String, ?> payload) {
    return RestAssured.given()
        .contentType(ContentType.JSON)
        .header("Authorization", "Bearer " + token)
        .body(payload)
        .when()
        .put(baseUrl() + "/api/tasks/" + id);
  }

  public static Response getTasks(String token, String status) {
    var req = RestAssured.given()
        .header("Authorization", "Bearer " + token);

    if (status != null) {
      req = req.queryParam("status", status);
    }
    return req.when().get(baseUrl() + "/api/tasks");
  }

  public static Response getTask(String token, String id) {
    return RestAssured.given()
        .header("Authorization", "Bearer " + token)
        .when()
        .get(baseUrl() + "/api/tasks/" + id);
  }
}
