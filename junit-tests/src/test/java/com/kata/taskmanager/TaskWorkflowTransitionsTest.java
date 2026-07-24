package com.kata.taskmanager;

import io.restassured.response.Response;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class TaskWorkflowTransitionsTest {

  private String baseUrl;
  private String username;
  private String password;

  private ApiClient api;
  private String token;

  private String createdTaskId;

  @BeforeEach
  void setUp() {
    baseUrl = System.getProperty("baseUrl", "http://localhost:3000");
    username = System.getProperty("username", "admin");
    password = System.getProperty("password", "password123");

    api = new ApiClient(baseUrl);
    token = api.loginAndGetToken(username, password);
  }

  @AfterEach
  void tearDown() {
    if (createdTaskId != null) {
      api.deleteTask(token, createdTaskId);
    }
  }

  private String createTodoTask() {
    Map<String, Object> payload = new HashMap<>();
    payload.put("title", "KT-22 JUnit transition test " + Instant.now().toEpochMilli());
    payload.put("description", "Created by automated JUnit test");
    payload.put("status", "todo");
    payload.put("priority", "medium");
    payload.put("assignee", username);

    Response res = api.createTask(token, payload);
    assertEquals(201, res.statusCode(), "Expected 201 when creating a task");

    createdTaskId = res.jsonPath().getString("data.id");
    assertNotNull(createdTaskId);
    return createdTaskId;
  }

  @Test
  void startTransition_todoToInProgress_persists() {
    String id = createTodoTask();

    Response patch = api.patchTaskStatus(token, id, Map.of("nextStatus", "in-progress"));
    assertEquals(200, patch.statusCode());
    assertEquals("in-progress", patch.jsonPath().getString("data.status"));

    // persistence check (simulates refresh / re-fetch)
    Response get = api.getTask(token, id);
    assertEquals(200, get.statusCode());
    assertEquals("in-progress", get.jsonPath().getString("data.status"));
  }

  @Test
  void completeTransition_inProgressToDone_persists() {
    String id = createTodoTask();

    Response patch1 = api.patchTaskStatus(token, id, Map.of("nextStatus", "in-progress"));
    assertEquals(200, patch1.statusCode());

    Response patch2 = api.patchTaskStatus(token, id, Map.of("nextStatus", "done"));
    assertEquals(200, patch2.statusCode());
    assertEquals("done", patch2.jsonPath().getString("data.status"));

    Response get = api.getTask(token, id);
    assertEquals(200, get.statusCode());
    assertEquals("done", get.jsonPath().getString("data.status"));
  }

  @Test
  void reopenTransition_doneToTodo_persists() {
    String id = createTodoTask();

    assertEquals(200, api.patchTaskStatus(token, id, Map.of("nextStatus", "in-progress")).statusCode());
    assertEquals(200, api.patchTaskStatus(token, id, Map.of("nextStatus", "done")).statusCode());

    Response patch3 = api.patchTaskStatus(token, id, Map.of("nextStatus", "todo"));
    assertEquals(200, patch3.statusCode());
    assertEquals("todo", patch3.jsonPath().getString("data.status"));

    Response get = api.getTask(token, id);
    assertEquals(200, get.statusCode());
    assertEquals("todo", get.jsonPath().getString("data.status"));
  }

  @Test
  void invalidTransition_todoToDone_isRejected() {
    String id = createTodoTask();

    Response patch = api.patchTaskStatus(token, id, Map.of("nextStatus", "done"));
    assertEquals(409, patch.statusCode());
    assertEquals("INVALID_TRANSITION", patch.jsonPath().getString("error.code"));

    // should remain todo
    Response get = api.getTask(token, id);
    assertEquals(200, get.statusCode());
    assertEquals("todo", get.jsonPath().getString("data.status"));
  }

  @Test
  void invalidPayload_nextStatusIsInvalid_isRejected() {
    String id = createTodoTask();

    Response patch = api.patchTaskStatus(token, id, Map.of("nextStatus", "INVALID"));
    assertEquals(400, patch.statusCode());
    assertEquals("VALIDATION_ERROR", patch.jsonPath().getString("error.code"));
  }

  @Test
  void missingAuth_isRejected() {
    String id = createTodoTask();

    Response patch = api.patchTaskStatus("", id, Map.of("nextStatus", "in-progress"));
    assertEquals(401, patch.statusCode());
    assertEquals("Unauthorized", patch.jsonPath().getString("error"));
  }
}
