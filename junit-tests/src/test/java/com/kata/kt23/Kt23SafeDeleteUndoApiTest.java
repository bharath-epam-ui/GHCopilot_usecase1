package com.kata.kt23;

import io.restassured.path.json.JsonPath;
import org.junit.jupiter.api.*;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class Kt23SafeDeleteUndoApiTest {

  private static String baseUrl;
  private static String username;
  private static String password;

  private ApiClient api;

  @BeforeAll
  static void readProps() {
    baseUrl = System.getProperty("baseUrl", "http://localhost:3000");
    username = System.getProperty("username", "user1");
    password = System.getProperty("password", "test1234");
  }

  @BeforeEach
  void login() {
    String token = AuthSupport.loginAndGetToken(baseUrl, username, password);
    api = new ApiClient(baseUrl, token);
  }

  @Test
  void softDelete_excludesFromList_and_restore_makesVisibleAgain() {
    // Create a task (unique title)
    String title = "KT-23 junit " + System.currentTimeMillis();
    var createdResp = api.post("/api/tasks", Map.of(
        "title", title,
        "description", "created by junit",
        "status", "todo",
        "priority", "medium",
        "assignee", username
    ), 201);

    String taskId = createdResp.jsonPath().getString("data.id");
    assertNotNull(taskId);

    // Ensure it appears in list
    var list1 = api.get("/api/tasks");
    assertEquals(200, list1.statusCode());
    List<Map<String, Object>> tasks1 = JsonPath.from(list1.asString()).getList("data");
    assertTrue(tasks1.stream().anyMatch(t -> taskId.equals(t.get("id"))));

    // Soft-delete
    var delResp = api.delete("/api/tasks/" + taskId, 200);
    assertTrue(delResp.jsonPath().getBoolean("ok"));
    assertEquals(taskId, delResp.jsonPath().getString("taskId"));
    assertNotNull(delResp.jsonPath().getString("deletedAt"));

    // Confirm deleted task is not in list anymore
    var list2 = api.get("/api/tasks");
    assertEquals(200, list2.statusCode());
    List<Map<String, Object>> tasks2 = JsonPath.from(list2.asString()).getList("data");
    assertFalse(tasks2.stream().anyMatch(t -> taskId.equals(t.get("id"))));

    // Restore
    var restoreResp = api.postNoBody("/api/tasks/" + taskId + "/restore", 200);
    assertTrue(restoreResp.jsonPath().getBoolean("ok"));
    assertEquals(taskId, restoreResp.jsonPath().getString("taskId"));

    // Confirm task is visible again
    var list3 = api.get("/api/tasks");
    assertEquals(200, list3.statusCode());
    List<Map<String, Object>> tasks3 = JsonPath.from(list3.asString()).getList("data");
    assertTrue(tasks3.stream().anyMatch(t -> taskId.equals(t.get("id"))));
  }

  @Test
  void delete_requiresAuth_returns401() {
    var resp = io.restassured.RestAssured.given()
        .baseUri(baseUrl)
        .accept(io.restassured.http.ContentType.JSON)
        .when()
        .delete("/api/tasks/t1");

    assertEquals(401, resp.statusCode());
    // KT-23 route returns {ok:false, code:"UNAUTHENTICATED"...}
    assertFalse(resp.jsonPath().getBoolean("ok"));
    assertEquals("UNAUTHENTICATED", resp.jsonPath().getString("code"));
  }

  @Test
  void restore_nonExisting_returns404() {
    var resp = api.postNoBody("/api/tasks/does-not-exist/restore", 404);
    assertFalse(resp.jsonPath().getBoolean("ok"));
    assertEquals("NOT_FOUND", resp.jsonPath().getString("code"));
  }
}
