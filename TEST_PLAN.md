# TaskFlow Test Plan

## 1. Purpose

This document defines the automated and manual tests used to verify TaskFlow.

The plan covers:

* Authentication
* Role-based authorization
* Work-item CRUD
* Assignment and reassignment
* Workflow transitions
* Time-extension requests
* Attachments
* Overdue calculations
* Phase Board behavior
* Timeline behavior
* Error handling
* Responsive presentation
* Clean-clone installation

## 2. Test environments

### Development database

```text
Database: taskflow
Host: localhost
Port: 5432
```

### Integration-test database

```text
Database: taskflow_test
Host: localhost
Port: 5433
```

### Application URLs

```text
Frontend: http://localhost:3000
API:      http://localhost:3001/api
```

## 3. Test accounts

### Manager

```text
manager@taskflow.local
Manager123!
```

### Members

```text
member1@taskflow.local
member2@taskflow.local
member3@taskflow.local

Member123!
```

## 4. Automated test coverage

### Backend unit tests

| Area                | Coverage                          |
| ------------------- | --------------------------------- |
| Workflow service    | Legal Member transition           |
| Workflow service    | Legal Manager transition          |
| Workflow service    | Illegal transition rejection      |
| Workflow service    | Unassigned Member rejection       |
| Workflow service    | Incorrect role rejection          |
| Workflow service    | Concurrent status-change conflict |
| Roles guard         | No role metadata                  |
| Roles guard         | Matching role                     |
| Roles guard         | Incorrect role                    |
| Overdue calculation | Active past-due item              |
| Overdue calculation | Done item                         |
| Overdue calculation | Cancelled item                    |

Run:

```bash
npm run test:unit --workspace=api
```

### Backend integration tests

| Area           | Coverage                            |
| -------------- | ----------------------------------- |
| Authentication | Manager login                       |
| Work items     | Manager creates item                |
| Assignment     | Manager assigns Member              |
| Authentication | Missing token returns 401           |
| Authorization  | Member creation attempt returns 403 |
| Validation     | Invalid work-item body returns 400  |
| Authentication | Invalid credentials return 401      |

Run:

```bash
npm run test:e2e --workspace=api
```

### Frontend component tests

| Area        | Coverage                          |
| ----------- | --------------------------------- |
| Phase Board | Items grouped under correct phase |
| Phase Board | Overdue item is marked            |
| Phase Board | Empty phase state                 |
| Phase Board | Detail link uses correct item ID  |

Run:

```bash
npm run test --workspace=web
```

## 5. Manual test execution

Record each result as:

```text
PASS
FAIL
BLOCKED
NOT RUN
```

When a test fails, record:

* Actual result
* Browser or environment
* Relevant API response
* Screenshot or console output
* Reproduction steps

## 6. Authentication tests

| ID      | Scenario             | Steps                                                      | Expected result                                           |
| ------- | -------------------- | ---------------------------------------------------------- | --------------------------------------------------------- |
| AUTH-01 | Manager login        | Log in with seeded Manager credentials                     | Dashboard opens and role displays as Manager              |
| AUTH-02 | Member login         | Log in with seeded Member credentials                      | Dashboard opens and role displays as Member               |
| AUTH-03 | Invalid password     | Submit a valid email with an incorrect password            | API returns 401 and UI shows an error                     |
| AUTH-04 | Unknown email        | Submit an unregistered email                               | API returns 401 without identifying which field was wrong |
| AUTH-05 | Member registration  | Register a new account                                     | Account is created with Member role                       |
| AUTH-06 | Duplicate email      | Register with an existing email                            | API returns a conflict or validation error                |
| AUTH-07 | Protected route      | Open `/dashboard` while logged out                         | User is redirected to `/login`                            |
| AUTH-08 | Session restoration  | Log in and refresh the browser                             | User remains logged in                                    |
| AUTH-09 | Invalid stored token | Replace the stored token with an invalid value and refresh | Token is cleared and user returns to `/login`             |
| AUTH-10 | Logout               | Select Log out                                             | Token is cleared and user returns to `/login`             |

## 7. Role and visibility tests

| ID      | Scenario                    | Steps                                                  | Expected result                             |
| ------- | --------------------------- | ------------------------------------------------------ | ------------------------------------------- |
| ROLE-01 | Manager navigation          | Log in as Manager                                      | Create Item link is visible                 |
| ROLE-02 | Member navigation           | Log in as Member                                       | Create Item link is hidden                  |
| ROLE-03 | Direct Manager route access | As Member, open `/work-items/new`                      | Frontend redirects away                     |
| ROLE-04 | Server permission           | As Member, call `POST /work-items`                     | API returns 403                             |
| ROLE-05 | Manager visibility          | Log in as Manager and open Work Items                  | All work items are visible                  |
| ROLE-06 | Member visibility           | Log in as Member 1                                     | Only items assigned to Member 1 are visible |
| ROLE-07 | Unauthorized item ID        | As Member 1, request an item assigned only to Member 2 | API does not return item details            |
| ROLE-08 | Member list endpoint        | As Member, request `/users/members`                    | API returns 403                             |
| ROLE-09 | Missing token               | Request a protected endpoint without a bearer token    | API returns 401                             |

## 8. Work-item CRUD tests

| ID      | Scenario               | Steps                                      | Expected result                                  |
| ------- | ---------------------- | ------------------------------------------ | ------------------------------------------------ |
| ITEM-01 | Create valid item      | Manager submits all required fields        | Item is created in Backlog                       |
| ITEM-02 | Create with attachment | Manager creates an item with a valid image | Item and attachment are created                  |
| ITEM-03 | Missing title          | Submit form without title                  | Validation prevents creation                     |
| ITEM-04 | Invalid priority       | Send unsupported priority through API      | API returns 400                                  |
| ITEM-05 | Invalid due date       | Send malformed date                        | API returns 400                                  |
| ITEM-06 | Extra field            | Send a `status` field in create input      | API rejects the unsupported field                |
| ITEM-07 | Edit title             | Manager edits item title                   | Detail, list, board, and timeline show new title |
| ITEM-08 | Edit due date          | Manager changes due date                   | Timeline moves item to new date                  |
| ITEM-09 | Direct status edit     | Include status in general update request   | API rejects the field                            |
| ITEM-10 | Delete item            | Manager confirms deletion                  | Item and dependent records are removed           |
| ITEM-11 | Member edit attempt    | Member calls the update endpoint           | API returns 403                                  |
| ITEM-12 | Member delete attempt  | Member calls the delete endpoint           | API returns 403                                  |

## 9. Filter tests

| ID        | Scenario               | Steps                                 | Expected result                       |
| --------- | ---------------------- | ------------------------------------- | ------------------------------------- |
| FILTER-01 | Status filter          | Select In Progress                    | Only In Progress items appear         |
| FILTER-02 | Priority filter        | Select Urgent                         | Only Urgent items appear              |
| FILTER-03 | Assignee filter        | As Manager, select Member 1           | Only Member 1 assignments appear      |
| FILTER-04 | Combined filters       | Select status, priority, and assignee | All returned items match every filter |
| FILTER-05 | Clear filters          | Apply filters and select Clear        | Full role-scoped list returns         |
| FILTER-06 | No matches             | Select filters with no matching items | Empty state appears                   |
| FILTER-07 | Member assignee filter | Log in as Member                      | Assignee filter is not displayed      |

## 10. Assignment tests

| ID        | Scenario                  | Steps                                  | Expected result                                  |
| --------- | ------------------------- | -------------------------------------- | ------------------------------------------------ |
| ASSIGN-01 | Assign one Member         | Assign Member 1 to Backlog item        | Item changes to Assigned                         |
| ASSIGN-02 | Assign multiple Members   | Select Members 1 and 2                 | Both assignments appear                          |
| ASSIGN-03 | Reassign                  | Replace Member 1 with Member 2         | Assignment and activity update                   |
| ASSIGN-04 | Remove one of several     | Remove Member 1 but retain Member 2    | Item remains active                              |
| ASSIGN-05 | Remove all                | Remove every assignee from active item | Item returns to Backlog                          |
| ASSIGN-06 | Invalid Member ID         | Send nonexistent UUID                  | Request fails without partial assignment         |
| ASSIGN-07 | Manager ID as assignee    | Send a Manager user ID                 | Request is rejected                              |
| ASSIGN-08 | Unchanged selection       | Submit the same assignment set         | Request returns a conflict or no-change response |
| ASSIGN-09 | Member assignment attempt | Member calls assignee endpoint         | API returns 403                                  |

## 11. Workflow transition tests

| ID      | Starting phase             | Actor           | Action            | Expected phase |
| ------- | -------------------------- | --------------- | ----------------- | -------------- |
| FLOW-01 | Assigned                   | Assigned Member | Start work        | In Progress    |
| FLOW-02 | In Progress                | Assigned Member | Submit for review | In Review      |
| FLOW-03 | In Review                  | Manager         | Accept            | Done           |
| FLOW-04 | In Review                  | Manager         | Send back         | In Progress    |
| FLOW-05 | Backlog                    | Manager         | Cancel            | Cancelled      |
| FLOW-06 | Assigned                   | Manager         | Cancel            | Cancelled      |
| FLOW-07 | In Progress                | Manager         | Cancel            | Cancelled      |
| FLOW-08 | In Review                  | Manager         | Cancel            | Cancelled      |
| FLOW-09 | Done with assignee         | Manager         | Reopen            | Assigned       |
| FLOW-10 | Cancelled with assignee    | Manager         | Reopen            | Assigned       |
| FLOW-11 | Cancelled without assignee | Manager         | Reopen            | Backlog        |

### Illegal workflow tests

| ID      | Scenario                            | Expected result              |
| ------- | ----------------------------------- | ---------------------------- |
| FLOW-12 | Start an In Progress item           | 409 Conflict                 |
| FLOW-13 | Submit an Assigned item for review  | 409 Conflict                 |
| FLOW-14 | Accept an In Progress item          | 409 Conflict                 |
| FLOW-15 | Reopen an active item               | 409 Conflict                 |
| FLOW-16 | Member accepts an item              | 403 Forbidden                |
| FLOW-17 | Manager starts Member work          | 403 Forbidden                |
| FLOW-18 | Unassigned Member starts an item    | 403 Forbidden                |
| FLOW-19 | Two requests update the same status | Only one transition succeeds |

## 12. Attachment tests

| ID      | Scenario              | Steps                                           | Expected result               |
| ------- | --------------------- | ----------------------------------------------- | ----------------------------- |
| FILE-01 | Upload JPEG           | Manager uploads valid JPEG under 5 MB           | Preview appears               |
| FILE-02 | Upload PNG            | Manager uploads valid PNG                       | Preview appears               |
| FILE-03 | Upload WebP           | Manager uploads valid WebP                      | Preview appears               |
| FILE-04 | Replace attachment    | Upload a second valid image                     | Existing image is replaced    |
| FILE-05 | Remove attachment     | Manager selects Remove                          | Image and metadata disappear  |
| FILE-06 | Oversized file        | Upload image larger than 5 MB                   | Upload is rejected            |
| FILE-07 | Unsupported type      | Upload PDF or executable                        | Upload is rejected            |
| FILE-08 | Spoofed MIME type     | Rename unsupported content with image extension | Content validation rejects it |
| FILE-09 | Missing token         | Request attachment without authentication       | API returns 401               |
| FILE-10 | Unassigned Member     | Request another Member's attachment             | API denies access             |
| FILE-11 | Assigned Member       | Request assigned item's attachment              | Image is returned             |
| FILE-12 | Member upload attempt | Member calls upload endpoint                    | API returns 403               |

## 13. Time-extension tests

| ID      | Scenario                                       | Expected result                                       |
| ------- | ---------------------------------------------- | ----------------------------------------------------- |
| TIME-01 | Assigned Member proposes later future date     | Pending request is created                            |
| TIME-02 | Proposed date is before current due date       | API returns 400                                       |
| TIME-03 | Proposed date is in the past                   | API returns 400                                       |
| TIME-04 | Duplicate pending request                      | API returns 409                                       |
| TIME-05 | Unassigned Member submits request              | API does not expose the item                          |
| TIME-06 | Request for Done item                          | API returns conflict                                  |
| TIME-07 | Request for Cancelled item                     | API returns conflict                                  |
| TIME-08 | Manager approves request                       | Request becomes Approved and due date changes         |
| TIME-09 | Manager rejects request                        | Request becomes Rejected and due date does not change |
| TIME-10 | Review approved request again                  | API returns 409                                       |
| TIME-11 | Review rejected request again                  | API returns 409                                       |
| TIME-12 | Proposed date becomes outdated before approval | Approval returns conflict                             |
| TIME-13 | Member reviews request                         | API returns 403                                       |
| TIME-14 | Manager lists pending requests                 | All pending requests appear                           |
| TIME-15 | Member lists requests                          | Only that Member's requests appear                    |

## 14. Overdue tests

| ID     | Scenario                       | Expected result            |
| ------ | ------------------------------ | -------------------------- |
| DUE-01 | Active item due in the past    | `isOverdue` is true        |
| DUE-02 | Active item due in the future  | `isOverdue` is false       |
| DUE-03 | Done item due in the past      | `isOverdue` is false       |
| DUE-04 | Cancelled item due in the past | `isOverdue` is false       |
| DUE-05 | Approve later due date         | Overdue state recalculates |
| DUE-06 | Cancel overdue item            | Overdue styling disappears |
| DUE-07 | Reopen past-due item           | Overdue styling returns    |

## 15. Phase Board tests

| ID       | Scenario              | Expected result                        |
| -------- | --------------------- | -------------------------------------- |
| BOARD-01 | Open board as Manager | All role-visible items appear          |
| BOARD-02 | Open board as Member  | Only assigned items appear             |
| BOARD-03 | Verify six columns    | Every workflow phase is present        |
| BOARD-04 | Verify phase grouping | Each item appears in its current phase |
| BOARD-05 | Change workflow phase | Item moves to new column               |
| BOARD-06 | Assign Backlog item   | Item moves to Assigned                 |
| BOARD-07 | Empty phase           | Empty-state message appears            |
| BOARD-08 | Overdue item          | Red styling appears                    |
| BOARD-09 | Item ordering         | Earliest due item appears first        |
| BOARD-10 | Card navigation       | Card opens correct detail page         |
| BOARD-11 | Small viewport        | Board scrolls horizontally             |
| BOARD-12 | Query failure         | Error and retry controls appear        |

## 16. Timeline tests

| ID      | Scenario                | Expected result                        |
| ------- | ----------------------- | -------------------------------------- |
| LINE-01 | Open Timeline           | Fourteen date columns appear           |
| LINE-02 | Today marker            | Today has visible red marker and label |
| LINE-03 | Date grouping           | Item appears under correct local date  |
| LINE-04 | Time ordering           | Earlier due time appears first         |
| LINE-05 | Previous week           | Range moves seven days backward        |
| LINE-06 | Next week               | Range moves seven days forward         |
| LINE-07 | Today button            | Range resets around current day        |
| LINE-08 | Outside-range items     | Informational message appears          |
| LINE-09 | Due-date edit           | Item moves to updated date             |
| LINE-10 | Extension approval      | Item moves to approved date            |
| LINE-11 | Status transition       | Status badge updates                   |
| LINE-12 | Overdue item            | Red styling appears                    |
| LINE-13 | Done past-due item      | No overdue styling                     |
| LINE-14 | Cancelled past-due item | No overdue styling                     |
| LINE-15 | Member view             | Only assigned deadlines appear         |
| LINE-16 | Small viewport          | Timeline scrolls horizontally          |
| LINE-17 | Empty account           | Empty-state message appears            |
| LINE-18 | Query failure           | Error and retry controls appear        |

## 17. Activity timeline tests

| ID     | Scenario      | Expected result                       |
| ------ | ------------- | ------------------------------------- |
| ACT-01 | Create item   | Item Created activity appears         |
| ACT-02 | Edit item     | Item Updated activity appears         |
| ACT-03 | Assign Member | Assignment activity appears           |
| ACT-04 | Start work    | Work Started activity appears         |
| ACT-05 | Submit review | Submitted for Review activity appears |
| ACT-06 | Accept        | Review Accepted activity appears      |
| ACT-07 | Send back     | Sent Back activity and note appear    |
| ACT-08 | Cancel        | Cancel activity and note appear       |
| ACT-09 | Reopen        | Reopen activity appears               |
| ACT-10 | Request time  | Request activity and reason appear    |
| ACT-11 | Approve time  | Approval and new due date appear      |
| ACT-12 | Reject time   | Rejection and note appear             |
| ACT-13 | Upload image  | Attachment Added activity appears     |
| ACT-14 | Replace image | Attachment Replaced activity appears  |
| ACT-15 | Remove image  | Attachment Removed activity appears   |

## 18. Error-response tests

Verify protected API errors use the same structure:

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "You do not have permission to perform this action",
  "path": "/api/example",
  "timestamp": "ISO timestamp"
}
```

| ID     | Status     | Scenario                                           |
| ------ | ---------- | -------------------------------------------------- |
| ERR-01 | 400        | Invalid DTO                                        |
| ERR-02 | 401        | Missing or invalid token                           |
| ERR-03 | 403        | Correct authentication but insufficient permission |
| ERR-04 | 404        | Missing or inaccessible record                     |
| ERR-05 | 409        | Illegal transition or conflicting state            |
| ERR-06 | 413 or 400 | Oversized attachment                               |

## 19. Responsive and usability tests

Test at approximately:

```text
375 × 667
768 × 1024
1440 × 900
```

Verify:

* Navigation remains usable
* Forms do not overflow
* Buttons remain readable
* Board scrolls horizontally
* Timeline scrolls horizontally
* Cards remain selectable
* Long descriptions wrap correctly
* Loading states do not cause broken layout
* Errors are visible near the affected action
* Keyboard focus is visible
* Form fields have labels
* Interactive elements can be reached by keyboard

## 20. Clean-clone test

Perform this from a separate directory.

```bash
git clone <repository-url> taskflow-clean-test
cd taskflow-clean-test

npm install

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

docker compose up -d --wait postgres postgres_test

cd apps/api
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
cd ../..

npm run lint
npm run test
npm run build
```

Then start both applications:

```bash
npm run dev:api
```

In another terminal:

```bash
npm run dev:web
```

Confirm:

* Frontend loads
* Seeded Manager can log in
* Work Items, Phase Board, and Timeline load
* A workflow transition succeeds
* No undocumented manual database action is required

## 21. Final test summary

Complete before submission:

| Check                          | Result |
| ------------------------------ | ------ |
| Backend unit tests pass        |        |
| Backend integration tests pass |        |
| Frontend tests pass            |        |
| API build passes               |        |
| Frontend build passes          |        |
| Lint passes                    |        |
| Clean-clone setup passes       |        |
| Manager workflow passes        |        |
| Member workflow passes         |        |
| Assignment permissions pass    |        |
| Attachment security passes     |        |
| Time-extension flow passes     |        |
| Phase Board passes             |        |
| Timeline passes                |        |
| Mobile layout passes           |        |
| No secrets are committed       |        |
| Git working tree is clean      |        |

## 22. Sign-off

```text
Tester:
Date:
Commit:
Environment:
Overall result:
Notes:
```
