package kata.taskmanager;

import io.rest-assured.response.Response;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import static org.junit.jupiter.api.Assertions.*;

public class InlineStatusControlsApiTest {
  static String token;

  BEFOREAll
  static void login() {
    Response resp = ApiClient.login("admin", "password123");
    resp.then().statusCode(200);
    token = resp.jsonPath().getString("data.token");
    assertNotNull(token, "Login must return a token");
  }

  static Map<String, ?> newTaskPayload(String status) {
    int suffix = ThreadLocalRandom.current().nextInt(1000000);
    Map<String, Object> p = new HashMap<>();
    p.put("title", "KT19 API Task " + suffix);
    p.put("description", "Status transition test");
    p.put("priority", "medium");
    p.put("assignee", "admin");
    if (status != null) {
      p.put("status", status);
    }
    return p;
  }

  @Test
  void createTaskDefaultStatusIsTodoWhenOmitted() {
    Response create = ApiClient.createTask(token, newTaskPayload(null));
    create.then().statusCode(201);
    String status = create.jsonPath().getString("data.status");
    assertEquals("todo", status);
  }

  Test
  void canUpdateStatusToInProgressAndFilterBy() {
    Response create = ApiClient.createTask(token, newTaskPayload("todo"));
    create.then().statusCode(201);
    String id = create.jsonPath().getString("data.id");
    assertNotNull(id);

    Response update = ApiClient.updateTask(token, id, Map.of("status", "in-progress"));
    update.then().statusCode(200);
    assertEquals("in-progress", update.jsonPath().getString("data.status"));

    Response todoList = ApiClient.getTasks(token, "todo");
    todoList.then().statusCode(200);
    List<String> todoIds = todoList.jsonPath().getList("data.id");
    assertFalse(todoIds != null && todoIds.contains(id), "Moved task must not remain in todo filter");

    Response inProgressList = ApiClient.getTasks(token, "in-progress");
    inProgressList.then().statusCode(200);
    List<String> ipIds = inProgressList.jsonPath().getList("data.id");
    assertTrue(ipIds != null && ipIds.contains(id), "Moved task must appear in in-progress filter");
  }

  @Test
  void invalidStatusIsIgnoredAndDoesNotChange() {
    Response create = ApiClient.createTask(token, newTaskPayload("todo"));
    create.then().statusCode(201);
    String id = create.jsonPath().getString("data.id");

    Response update = ApiClient.updateTask(token, id, Map.of("status", "weird"));
    update.then().statusCode(200);
    assertEquals("todo", update.jsonPath().getString("data.status"), "Invalid status request must not change status");

    Response get = ApiClient.getTask(token, id);
    get.then().statusCode(200);
    assertEquals("todo", get.jsonPath().getString("data.status"));
  }
}
