param(
  [Parameter(Mandatory = $true)]
  [string]$JiraBaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$JiraEmail,

  [Parameter(Mandatory = $true)]
  [string]$JiraApiToken,

  [string]$ProjectKey = "KT"
)

$pair = "${JiraEmail}:${JiraApiToken}"
$basic = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($pair))
$headers = @{
  Authorization = "Basic $basic"
  Accept = "application/json"
  "Content-Type" = "application/json"
}

function New-JiraStoryBody {
  param(
    [string]$Summary,
    [string]$StoryText,
    [string[]]$ScopeBullets
  )

  $listItems = @()
  foreach ($item in $ScopeBullets) {
    $listItems += @{
      type = "listItem"
      content = @(
        @{
          type = "paragraph"
          content = @(
            @{ type = "text"; text = $item }
          )
        }
      )
    }
  }

  return @{
    fields = @{
      project = @{ key = $ProjectKey }
      issuetype = @{ name = "Story" }
      summary = $Summary
      description = @{
        type = "doc"
        version = 1
        content = @(
          @{
            type = "paragraph"
            content = @(
              @{ type = "text"; text = $StoryText }
            )
          },
          @{
            type = "bulletList"
            content = $listItems
          }
        )
      }
    }
  } | ConvertTo-Json -Depth 20
}

$story1Body = New-JiraStoryBody \
  -Summary "KT-CAPSTONE: Task Due Dates and Overdue Tracking (Option A)" \
  -StoryText "As an authenticated user, I want to set due dates on tasks so I can track deadlines and identify overdue work." \
  -ScopeBullets @(
    "Add optional dueDate in create and update task flows.",
    "Display due date and overdue indicator in task card.",
    "Add overdue filter in dashboard.",
    "Keep backward compatibility for tasks without due date."
  )

$story2Body = New-JiraStoryBody \
  -Summary "KT-CAPSTONE-DEMO: Task Search and Advanced Filtering (Option B)" \
  -StoryText "As an authenticated user, I want to search tasks and apply combined filters so I can find tasks quickly." \
  -ScopeBullets @(
    "Add search query support on title and description.",
    "Add priority and combined filters in API and UI.",
    "Handle empty state for no matches.",
    "Add UI and API automation coverage for combined filters."
  )

$uri = "$JiraBaseUrl/rest/api/3/issue"
$r1 = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $story1Body
$r2 = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -Body $story2Body

[PSCustomObject]@{
  Story1Key = $r1.key
  Story1Url = "$JiraBaseUrl/browse/$($r1.key)"
  Story2Key = $r2.key
  Story2Url = "$JiraBaseUrl/browse/$($r2.key)"
}
