# Codex Engineering Brief: Agent-ready Personal Workspace Database & Backend Refactor

## 0. Objective

Refactor the current project into a workspace-owned, resource-centered, externally-agent-accessible personal data platform.

This project is **not** an internal Agent runtime. It must not host, schedule, or execute built-in AI Agents. Instead, it exposes structured data, permissions, REST APIs, Webhooks, and MCP-compatible tools so that user-authorized external Agents, scripts, CLI tools, integrations, and MCP clients can safely read and write user workspace data.

Primary backend stack assumptions:

- NestJS
- Prisma
- PostgreSQL
- Redis or queue system for async jobs
- REST API as primary API
- MCP Server as external Agent/tool interface
- GraphQL only as future-compatible design, not required in this implementation

------

# 1. Locked Product Decisions

## 1.1 Product Boundary

The system is:

- An Agent-ready structured personal workspace.
- A workspace-owned data platform.
- A resource graph and automation platform.
- A webhook and MCP-compatible data access layer for external Agents.

The system is not:

- An internal AI Agent runtime.
- An AI chat product.
- An Agent planning engine.
- An Agent memory store.
- A tool that allows external Agents to directly call internal services or access the database.

## 1.2 External Agent Rule

External Agents must only access the system through:

- REST API
- API Token / Personal Access Token
- External Client Registration
- Webhook subscriptions
- MCP Server tools

External Agents must not:

- Call internal NestJS services directly.
- Access PostgreSQL directly.
- Run code inside the application runtime.
- Bypass permission, scope, audit, idempotency, or rate-limit middleware.

## 1.3 Ownership Model

All user data must belong to a `workspace`.

Users are members of workspaces.

The database must support multi-member workspaces even if the UI initially behaves like a personal single-user workspace.

## 1.4 Resource Model

Only root domain objects that are visible, searchable, relatable, API-operable, or external-agent-operable should be resources.

Examples that should be resources:

- Todo
- Folder
- Project
- Calendar Event
- Finance Transaction
- Journal Entry
- Finance Account
- Budget
- Attachment
- Dashboard
- Automation Rule
- Plugin Installation
- Custom Plugin Resource

Examples that should usually not be resources:

- Join tables
- Tags relation rows
- Journal lines
- Webhook delivery rows
- Audit log rows
- Workspace member rows
- API credential scope rows
- Internal queue rows

## 1.5 ID Strategy

Use:

- Internal primary key: `BigInt`
- External public identifier: `ULID`

Rules:

- External APIs must only expose ULIDs.
- MCP tools must only expose ULIDs.
- Webhook payloads must only expose ULIDs.
- Internal services may use BigInt.
- Never expose internal numeric IDs externally.

------

# 2. Do Not Implement

Do not implement the following unless explicitly requested later:

- Internal Agent runtime
- Agent sessions
- Agent messages
- Agent memory
- Agent plans
- Agent tool execution engine
- Built-in LLM orchestration
- Direct database access for external Agents
- Plugin direct access to core application tables
- GraphQL API implementation
- Elasticsearch / OpenSearch
- Full OAuth server
- Multi-currency accounting logic
- Plugin-created arbitrary database tables

GraphQL may be considered in service/data-layer design, but do not build GraphQL resolvers in this refactor.

OAuth-style external authorization may be reserved in schema design, but first implementation should focus on API credentials and external client registration.

------

# 3. Core Database Refactor

## 3.1 Workspace and Membership

Create or refactor these models:

```prisma
model Workspace {
  id          BigInt   @id @default(autoincrement())
  publicId   String   @unique
  name        String
  slug        String?  @unique
  type        String   // personal | team | organization
  status      String   // active | disabled | archived

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  archivedAt  DateTime?
  trashedAt   DateTime?
  deletedAt   DateTime?

  members     WorkspaceMember[]
  resources   Resource[]

  @@index([status])
}

model WorkspaceMember {
  id           BigInt   @id @default(autoincrement())
  workspaceId BigInt
  userId       BigInt

  role         String   // owner | admin | member | viewer
  scopes       Json?
  status       String   // active | invited | disabled | removed

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  workspace    Workspace @relation(fields: [workspaceId], references: [id])
  user         User      @relation(fields: [userId], references: [id])

  @@unique([workspaceId, userId])
  @@index([userId])
  @@index([workspaceId, role])
}
```

Implementation requirements:

- On user registration, create a personal workspace automatically.
- Add workspace context middleware or guard.
- All domain queries must be scoped by `workspaceId`.
- Never query workspace-owned data by `userId` alone.

------

# 4. External Client, Credential, Actor

## 4.1 External Client

External clients represent external Agents, scripts, CLI tools, integrations, MCP clients, webhook consumers, or automation tools.

```prisma
model ExternalClient {
  id              BigInt   @id @default(autoincrement())
  publicId        String   @unique
  workspaceId     BigInt

  name            String
  clientType      String   // agent | script | cli | integration | mcp_client | webhook_consumer | automation_tool
  provider        String?  // openai | anthropic | custom | zapier | n8n | other
  description     String?
  websiteUrl      String?
  status          String   // active | disabled | revoked

  createdByUserId BigInt?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  workspace       Workspace @relation(fields: [workspaceId], references: [id])

  @@index([workspaceId, clientType])
  @@index([workspaceId, status])
}
```

## 4.2 API Credential

```prisma
model ApiCredential {
  id               BigInt   @id @default(autoincrement())
  publicId         String   @unique
  workspaceId      BigInt

  externalClientId BigInt?
  createdByUserId  BigInt?

  credentialType   String   // api_token | personal_access_token | oauth_grant_reserved
  name             String
  tokenHash        String   @unique
  scopes           Json
  status           String   // active | revoked | expired

  expiresAt        DateTime?
  revokedAt        DateTime?
  lastUsedAt       DateTime?

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  workspace        Workspace @relation(fields: [workspaceId], references: [id])

  @@index([workspaceId, status])
  @@index([externalClientId])
}
```

Rules:

- Store only token hashes.
- Never store raw tokens after creation.
- Support scoped credentials.
- Every external API request must resolve to an Actor.

## 4.3 Actor

Actor is the audit identity of an operation.

```prisma
model Actor {
  id                BigInt   @id @default(autoincrement())
  publicId          String   @unique
  workspaceId       BigInt

  actorType         String   // user | external_client | credential | automation | plugin | system
  userId            BigInt?
  externalClientId  BigInt?
  apiCredentialId   BigInt?
  pluginId          BigInt?
  automationRuleId  BigInt?

  displayName       String
  status            String   // active | disabled

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  workspace         Workspace @relation(fields: [workspaceId], references: [id])

  @@index([workspaceId, actorType])
}
```

Requirements:

- User frontend operations must have a user actor.
- External Agent/API/MCP operations must have an external-client or credential actor.
- Automation operations must have an automation actor.
- Plugin operations must have a plugin actor.
- System jobs must have a system actor.
- All write operations must receive actor context.

------

# 5. Resource System

## 5.1 Resource Type Definition

Do not implement resource type as a Prisma enum.

Resource types must be rows so that plugins can register new types.

```prisma
model ResourceTypeDefinition {
  id                     BigInt   @id @default(autoincrement())
  publicId               String   @unique

  namespace              String   // core | todo | finance | calendar | plugin:<pluginPublicId>
  key                    String
  typeName               String   @unique // core.todo, finance.transaction, calendar.event
  displayName            String
  description            String?

  ownershipModel         String   // workspace | user | system
  schemaJson             Json?
  capabilitiesJson       Json?
  defaultPermissionsJson Json?
  uiSchemaJson           Json?

  isSystem               Boolean  @default(false)
  pluginId               BigInt?
  status                 String   // active | deprecated | disabled

  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  @@unique([namespace, key])
  @@index([status])
}
```

Seed built-in resource types:

- `core.folder`
- `core.project`
- `core.todo`
- `calendar.event`
- `finance.account`
- `finance.transaction`
- `finance.journal_entry`
- `finance.budget`
- `file.attachment`
- `dashboard.dashboard`
- `dashboard.widget`
- `automation.rule`
- `plugin.installation`

## 5.2 Resource

```prisma
model Resource {
  id             BigInt   @id @default(autoincrement())
  publicId       String   @unique

  workspaceId    BigInt
  typeId         BigInt
  typeName       String

  title          String
  summary        String?
  metadata       Json?

  status         String   // active | archived | trashed | deleted
  visibility     String   // private | workspace | shared

  createdByActorId BigInt?
  updatedByActorId BigInt?
  deletedByActorId BigInt?

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  archivedAt     DateTime?
  trashedAt      DateTime?
  deletedAt      DateTime?

  workspace      Workspace @relation(fields: [workspaceId], references: [id])
  type           ResourceTypeDefinition @relation(fields: [typeId], references: [id])

  @@index([workspaceId, typeName])
  @@index([workspaceId, status])
  @@index([workspaceId, updatedAt])
  @@index([workspaceId, archivedAt])
  @@index([workspaceId, trashedAt])
  @@index([workspaceId, deletedAt])
}
```

Rules:

- Root domain tables must contain `resourceId`.
- `resources.typeName` is a cached denormalized field for query convenience.
- Validate `typeName` against `resource_type_definitions`.
- The resource row must be created in the same transaction as the domain row.
- Resource lifecycle timestamps drive archive/trash/delete behavior.

------

# 6. Deletion Semantics

Use three levels:

- `archivedAt`: hidden from active views but still normal data.
- `trashedAt`: visible in trash/recycle bin.
- `deletedAt`: soft-deleted and hidden from normal queries.
- Permanent deletion: physical deletion performed by background cleanup job.

Rules:

- Domain objects must follow their linked resource lifecycle.
- API delete should default to trash, not permanent delete.
- Permanent delete requires explicit endpoint and permission.
- Audit log must record archive, trash, restore, soft delete, and permanent delete intent.
- Permanent delete must not break accounting integrity unless explicitly allowed by domain rules.

------

# 7. Relation Graph

## 7.1 Relation Type

```prisma
model RelationType {
  id                BigInt   @id @default(autoincrement())
  publicId          String   @unique

  namespace         String
  key               String
  typeName          String   @unique // core.related_to, core.depends_on, finance.paid_for

  displayName       String
  description       String?

  allowedFromTypes  Json?
  allowedToTypes    Json?

  isDirectional     Boolean  @default(true)
  inverseTypeName   String?
  isSystem          Boolean  @default(false)
  pluginId          BigInt?

  status            String   // active | deprecated | disabled

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([namespace, key])
}
```

Seed relation types:

- `core.related_to`
- `core.depends_on`
- `core.blocks`
- `core.parent_of`
- `core.duplicates`
- `calendar.scheduled_for`
- `finance.paid_for`
- `finance.reimburses`
- `finance.belongs_to_event`
- `file.attached_to`

## 7.2 Resource Relation

```prisma
model ResourceRelation {
  id                  BigInt   @id @default(autoincrement())
  publicId            String   @unique

  workspaceId          BigInt
  fromResourceId       BigInt
  toResourceId         BigInt
  relationTypeId       BigInt
  relationTypeName     String

  source               String   // user | external_client | automation | plugin | import | system
  confidence           Decimal? @db.Decimal(5, 4)
  evidence             Json?

  status               String   // proposed | confirmed | rejected | active | archived
  confirmedByActorId   BigInt?
  rejectedByActorId    BigInt?

  createdByActorId     BigInt?
  updatedByActorId     BigInt?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@unique([workspaceId, fromResourceId, toResourceId, relationTypeName])
  @@index([workspaceId, fromResourceId])
  @@index([workspaceId, toResourceId])
  @@index([workspaceId, relationTypeName])
  @@index([workspaceId, status])
}
```

Requirements:

- Relations must always connect resources inside the same workspace.
- Relation creation must validate relation type constraints.
- External clients may propose relations if their scope allows it.
- Relations can be confirmed or rejected by users.
- Relation APIs must support graph traversal by resource ULID.

------

# 8. Tags, Attachments, Notes, Comments, Activity

## 8.1 Unified Tags

```prisma
model Tag {
  id          BigInt   @id @default(autoincrement())
  publicId    String   @unique
  workspaceId BigInt

  name        String
  color       String?
  scopeType   String   // global | ledger | folder | project | plugin
  scopeId     BigInt?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([workspaceId, scopeType, scopeId, name])
  @@index([workspaceId])
}

model ResourceTag {
  id          BigInt @id @default(autoincrement())
  workspaceId BigInt
  resourceId BigInt
  tagId      BigInt

  createdAt  DateTime @default(now())

  @@unique([resourceId, tagId])
  @@index([workspaceId, tagId])
}
```

## 8.2 Attachments

Attachments should be resources.

```prisma
model Attachment {
  id          BigInt   @id @default(autoincrement())
  resourceId  BigInt   @unique
  workspaceId BigInt

  filename    String
  storageKey  String
  mimeType    String?
  sizeBytes   BigInt?
  checksum    String?
  metadata    Json?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workspaceId])
}

model ResourceAttachment {
  id                   BigInt @id @default(autoincrement())
  workspaceId           BigInt
  ownerResourceId       BigInt
  attachmentResourceId  BigInt

  createdAt             DateTime @default(now())

  @@unique([ownerResourceId, attachmentResourceId])
  @@index([workspaceId, ownerResourceId])
}
```

## 8.3 Notes, Comments, Activity

```prisma
model ResourceNote {
  id              BigInt   @id @default(autoincrement())
  publicId        String   @unique
  workspaceId     BigInt
  resourceId      BigInt
  authorActorId   BigInt?

  body            String
  visibility      String   // private | workspace

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId, resourceId])
}

model ResourceComment {
  id              BigInt   @id @default(autoincrement())
  publicId        String   @unique
  workspaceId     BigInt
  resourceId      BigInt
  authorActorId   BigInt?

  body            String
  status          String   // active | edited | deleted

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?

  @@index([workspaceId, resourceId])
}

model ActivityItem {
  id              BigInt   @id @default(autoincrement())
  publicId        String   @unique
  workspaceId     BigInt
  resourceId      BigInt?
  actorId         BigInt?

  activityType    String
  title           String
  summary         String?
  metadata        Json?

  createdAt       DateTime @default(now())

  @@index([workspaceId, resourceId, createdAt])
}
```

Activity is user-facing.
Audit log is security/system-facing.
Do not merge them.

------

# 9. Audit Log

## 9.1 Audit Model

```prisma
model AuditLog {
  id                BigInt   @id @default(autoincrement())
  publicId          String   @unique

  workspaceId        BigInt
  actorId            BigInt?
  userId             BigInt?
  externalClientId   BigInt?
  apiCredentialId    BigInt?

  resourceId         BigInt?
  resourceTypeName   String?

  action             String // create | update | archive | trash | restore | soft_delete | permanent_delete | relate | unrelate | permission_change
  domain             String // resource | todo | finance | calendar | plugin | automation | webhook | auth

  beforeSnapshot     Json?
  afterSnapshot      Json?
  diff               Json?

  requestId          String?
  idempotencyKey     String?
  ipAddress          String?
  userAgent          String?
  metadata           Json?

  createdAt          DateTime @default(now())

  @@index([workspaceId, createdAt])
  @@index([workspaceId, actorId])
  @@index([workspaceId, resourceId])
  @@index([requestId])
  @@index([idempotencyKey])
}
```

## 9.2 Audit Detail Rules

Use full snapshots for critical domains:

- Finance
- Permissions
- API credentials
- External clients
- Plugins
- Automation
- Webhooks
- Permanent delete operations

Use diff for ordinary domains:

- Todo
- Calendar
- Dashboard
- Notes
- Comments

All create/update/delete/relate operations must create audit logs.

------

# 10. Idempotency

Implement idempotency for:

- External API calls
- API Token calls
- External Client calls
- MCP calls
- Webhook callbacks
- Optional frontend writes

```prisma
model IdempotencyKey {
  id              BigInt   @id @default(autoincrement())
  workspaceId     BigInt
  actorId         BigInt?

  key             String
  requestMethod   String
  requestPath     String
  requestHash     String
  responseSnapshot Json?
  statusCode      Int?
  status          String // processing | completed | failed

  expiresAt       DateTime
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([workspaceId, actorId, key])
  @@index([expiresAt])
}
```

Requirements:

- External clients should send `Idempotency-Key` header for write requests.
- Same key + same request hash returns cached response.
- Same key + different request hash returns conflict.
- Expire old keys via cleanup job.

------

# 11. Domain Events, Webhooks, and Automation Event Stream

## 11.1 Domain Event

```prisma
model DomainEvent {
  id                 BigInt   @id @default(autoincrement())
  publicId           String   @unique

  workspaceId         BigInt
  actorId             BigInt?
  resourceId          BigInt?
  resourceTypeName    String?

  eventType           String // resource.created, resource.updated
  specificEventType   String // core.todo.created, finance.transaction.created
  payload             Json

  occurredAt          DateTime @default(now())
  processedAt         DateTime?

  @@index([workspaceId, occurredAt])
  @@index([workspaceId, eventType])
  @@index([workspaceId, specificEventType])
  @@index([workspaceId, resourceId])
}
```

Event naming rule:

- Store generic event type.
- Store specific event type.
- Webhooks may subscribe to either.

Examples:

- `resource.created` + `core.todo.created`
- `resource.updated` + `finance.transaction.updated`
- `resource.deleted` + `calendar.event.deleted`
- `relation.created` + `core.related_to.created`

## 11.2 Webhook Subscription

```prisma
model WebhookSubscription {
  id                 BigInt   @id @default(autoincrement())
  publicId           String   @unique

  workspaceId         BigInt
  externalClientId    BigInt?

  name               String
  url                String
  secretHash         String?
  eventTypes         Json
  payloadMode        String // thin | summary | full
  status             String // active | disabled

  retryPolicy        Json?

  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  @@index([workspaceId, status])
}
```

## 11.3 Webhook Delivery

```prisma
model WebhookDelivery {
  id                  BigInt   @id @default(autoincrement())
  publicId            String   @unique

  workspaceId          BigInt
  subscriptionId       BigInt
  domainEventId        BigInt

  status              String // pending | delivered | failed | dead_letter
  attemptCount        Int    @default(0)
  nextAttemptAt       DateTime?

  requestPayload      Json?
  responseStatus      Int?
  responseBody        String?
  errorMessage        String?

  deliveredAt         DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  @@index([workspaceId, status])
  @@index([nextAttemptAt])
}
```

Webhook requirements:

- HMAC sign all deliveries.
- Include event ULID.
- Include resource ULID.
- Include payload mode.
- Support thin, summary, and full payload modes.
- Default payload mode: summary.
- Retry with configurable retry policy.
- Failed deliveries eventually become dead-letter.
- Allow manual replay.

## 11.4 Event Flow

All write operations should:

1. Validate permissions.
2. Open database transaction.
3. Create/update domain row.
4. Create/update resource row if needed.
5. Create audit log.
6. Create domain event.
7. Commit transaction.
8. Async workers consume domain events for:
   - Webhook deliveries
   - Automation rules
   - Notifications
   - Activity timeline generation
   - Search indexing

Do not send webhooks synchronously inside the write transaction.

------

# 12. Authorization and Scopes

## 12.1 Role + Scope Model

Use workspace role plus scopes.

Roles:

- owner
- admin
- member
- viewer

Scope naming must support:

- Global scopes
- Resource-type scopes
- Module scopes

Examples:

```text
resource.read
resource.write
resource:core.todo.read
resource:core.todo.write
resource:finance.transaction.read
resource:finance.transaction.write
relation.read
relation.create
relation.update
relation.delete
webhook.manage
automation.manage
automation.run
plugin.install
plugin.manage
mcp.use
finance.read
finance.write
calendar.read
calendar.write
```

Requirements:

- Workspace role grants default capabilities.
- API credentials must be explicitly scoped.
- External clients must not exceed the scopes of the credential used.
- MCP tools must use the same permission system as REST APIs.
- Permission checks must occur before service execution.
- All denied writes should be audit-logged if security-relevant.

------

# 13. REST API Design

## 13.1 API Rules

- Public API paths should use `/api/v1`.
- External IDs must be ULIDs only.
- Do not accept internal BigInt IDs in API payloads.
- All write APIs must support actor context, audit, domain events, and idempotency.
- Domain APIs should return domain objects with a `resource` field.
- Resource API should return Resource Envelope.
- GraphQL should not be implemented now.

## 13.2 Resource API

Implement:

```http
GET    /api/v1/resources
GET    /api/v1/resources/:resourceId
PATCH  /api/v1/resources/:resourceId
POST   /api/v1/resources/:resourceId/archive
POST   /api/v1/resources/:resourceId/trash
POST   /api/v1/resources/:resourceId/restore
DELETE /api/v1/resources/:resourceId
GET    /api/v1/resources/:resourceId/relations
GET    /api/v1/resources/:resourceId/activity
GET    /api/v1/resources/:resourceId/comments
GET    /api/v1/resources/:resourceId/notes
```

Resource envelope shape:

```json
{
  "resource": {
    "id": "01J...",
    "type": "core.todo",
    "title": "Pay invoice",
    "summary": "Due tomorrow",
    "status": "active",
    "createdAt": "...",
    "updatedAt": "..."
  },
  "data": {},
  "relations": [],
  "permissions": []
}
```

## 13.3 Domain APIs

Keep domain APIs for frontend and business logic:

```http
/todos
/calendar-events
/finance/transactions
/finance/accounts
/finance/budgets
```

Domain API responses must include:

```json
{
  "resource": {
    "id": "01J...",
    "type": "core.todo"
  },
  "data": {}
}
```

------

# 14. MCP Server

## 14.1 MCP Scope

Implement MCP-compatible tools for external clients.

Expose:

- Resource CRUD tools
- Domain tools for Todo / Calendar / Finance
- Search tools
- Relation tools

Do not expose automation management tools through MCP in this refactor.

MCP must share:

- API credential authentication
- External client identity
- Workspace scoping
- Scope authorization
- Audit logging
- Idempotency
- Rate limiting

## 14.2 Suggested MCP Tools

```text
resource.search
resource.get
resource.create
resource.update
resource.archive
resource.trash
resource.restore
resource.relate
resource.unrelate
relation.list
todo.create
todo.update
todo.complete
calendar_event.create
calendar_event.update
finance_transaction.create
finance_transaction.get
finance_account.list
```

Tool responses must use ULIDs.

------

# 15. Search

Use hybrid PostgreSQL-first search.

Implement:

- PostgreSQL full-text search
- Trigram fuzzy search
- Later vector embedding support

Do not implement Elasticsearch/OpenSearch now.

Suggested table:

```prisma
model SearchIndex {
  id               BigInt   @id @default(autoincrement())
  workspaceId      BigInt
  resourceId       BigInt   @unique
  resourceTypeName String

  title            String
  summary          String?
  content          String?
  metadata         Json?

  searchText       String
  embedding        Unsupported("vector")?

  updatedAt        DateTime @updatedAt

  @@index([workspaceId, resourceTypeName])
}
```

If pgvector is not yet installed, omit the `embedding` field and leave a migration note.

Search indexing should be triggered from `domain_events`.

------

# 16. Todo Domain

Refactor Todo as a resource-backed domain model.

```prisma
model Todo {
  id              BigInt   @id @default(autoincrement())
  resourceId      BigInt   @unique
  workspaceId     BigInt

  folderResourceId BigInt?
  parentTodoId      BigInt?

  title           String
  description     String?
  status          String   // open | in_progress | completed | canceled
  priority        String?  // low | medium | high | urgent

  dueAt           DateTime?
  startAt         DateTime?
  scheduledAt     DateTime?
  completedAt     DateTime?
  timezone        String?

  estimateMinutes Int?
  sortOrder       Int?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId, status])
  @@index([workspaceId, dueAt])
  @@index([workspaceId, parentTodoId])
}
```

Todo requirements:

- Create linked resource with type `core.todo`.
- Completing todo updates both domain row and resource activity.
- Parent-child todos must prevent cycles.
- Due date should be datetime, not date-only.
- Todo changes emit domain events.

------

# 17. Calendar Domain

Use `calendar_events`, not generic `events`.

```prisma
model CalendarEvent {
  id              BigInt   @id @default(autoincrement())
  resourceId      BigInt   @unique
  workspaceId     BigInt

  title           String
  description     String?
  location        String?

  startsAt        DateTime
  endsAt          DateTime
  timezone        String
  allDay          Boolean  @default(false)

  recurrenceRuleId BigInt?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId, startsAt])
  @@index([workspaceId, endsAt])
}
```

Rules:

- Validate `startsAt <= endsAt`.
- Emit `calendar.event.created`, `calendar.event.updated`, `calendar.event.deleted`.
- Calendar events are resources.
- Calendar events may relate to todos, transactions, attachments, projects, or finance events.

------

# 18. Finance Domain: Single-currency Double-entry Accounting

## 18.1 Finance Rule

Implement professional double-entry accounting, but single-currency per ledger.

Rules:

- Each ledger has one currency.
- Each account inherits ledger currency.
- Each transaction, journal entry, and journal line must use ledger currency.
- Keep `currency` fields for future compatibility, but reject cross-currency writes.
- No exchange rates in this implementation.

## 18.2 Ledger

```prisma
model Ledger {
  id          BigInt   @id @default(autoincrement())
  publicId    String   @unique
  workspaceId BigInt

  name        String
  currency    String   // ISO 4217, single currency
  status      String   // active | archived

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workspaceId])
}
```

## 18.3 Account

Accounts should be resources.

```prisma
model FinanceAccount {
  id          BigInt   @id @default(autoincrement())
  resourceId  BigInt   @unique
  workspaceId BigInt
  ledgerId    BigInt

  name        String
  accountType String  // asset | liability | equity | income | expense
  currency    String
  status      String  // active | archived

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workspaceId, ledgerId])
  @@index([ledgerId, accountType])
}
```

## 18.4 User-visible Transaction

Keep transactions as user-visible objects.

```prisma
model FinanceTransaction {
  id              BigInt   @id @default(autoincrement())
  resourceId      BigInt   @unique
  workspaceId     BigInt
  ledgerId        BigInt

  title           String
  description     String?
  occurredAt      DateTime
  transactionType String   // income | expense | transfer | adjustment
  amount          Decimal  @db.Decimal(18, 4)
  currency        String

  journalEntryId  BigInt?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId, occurredAt])
  @@index([ledgerId, occurredAt])
}
```

## 18.5 Journal Entry and Lines

Journal entries should be resources.

Journal lines do not need to be resources.

```prisma
model JournalEntry {
  id              BigInt   @id @default(autoincrement())
  resourceId      BigInt   @unique
  workspaceId     BigInt
  ledgerId        BigInt

  occurredAt      DateTime
  description     String?
  currency        String
  sourceType      String?  // transaction | import | adjustment | automation
  sourceId        BigInt?

  status          String   // draft | posted | voided

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId, occurredAt])
  @@index([ledgerId, occurredAt])
}

model JournalLine {
  id              BigInt   @id @default(autoincrement())
  workspaceId     BigInt
  ledgerId        BigInt
  journalEntryId  BigInt
  accountId       BigInt

  debit           Decimal  @db.Decimal(18, 4)
  credit          Decimal  @db.Decimal(18, 4)
  currency        String
  description     String?

  createdAt       DateTime @default(now())

  @@index([journalEntryId])
  @@index([accountId])
}
```

Accounting validation:

- Every posted journal entry must balance.
- Sum debit must equal sum credit.
- Debit and credit cannot both be positive on the same line.
- Debit and credit cannot both be zero.
- Journal entry currency must equal ledger currency.
- Journal line currency must equal ledger currency.
- Account currency must equal ledger currency.
- Posted entries should not be edited directly; use reversal or adjustment entries.

------

# 19. Finance Events

Use `finance_events` separately from `calendar_events` and `domain_events`.

Finance events represent domain context such as trip, reimbursement cycle, project spending period, tax period, or subscription lifecycle.

```prisma
model FinanceEvent {
  id          BigInt   @id @default(autoincrement())
  resourceId  BigInt   @unique
  workspaceId BigInt
  ledgerId    BigInt?

  title       String
  description String?
  startsAt    DateTime?
  endsAt      DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([workspaceId])
}
```

Finance events can be related to transactions using resource relations.

------

# 20. Automation and Workflow DAG

## 20.1 Automation Rule

Automation rules should be resources.

```prisma
model AutomationRule {
  id              BigInt   @id @default(autoincrement())
  resourceId      BigInt   @unique
  workspaceId     BigInt

  name            String
  description     String?
  status          String   // active | disabled | archived

  triggerJson     Json
  workflowJson    Json
  version         Int      @default(1)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId, status])
}
```

## 20.2 Workflow Run

```prisma
model WorkflowRun {
  id              BigInt   @id @default(autoincrement())
  publicId        String   @unique
  workspaceId     BigInt
  automationRuleId BigInt?

  triggerEventId  BigInt?
  status          String   // pending | running | waiting | succeeded | failed | canceled

  input           Json?
  output          Json?
  error           Json?

  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId, status])
  @@index([triggerEventId])
}
```

## 20.3 Workflow Node Types

Support schema-level design for:

- Trigger
- Condition
- Action
- Branch / if-else
- Delay / wait until
- Manual approval
- Webhook call
- External client callback
- MCP tool call

Implementation note:

- It is acceptable to implement only a minimal executor first.
- The schema and service interfaces must support the full node set.
- Workflow execution must consume `domain_events`.
- Workflow writes must create audit logs and domain events.

------

# 21. Notifications

Implement unified notifications.

```prisma
model Notification {
  id              BigInt   @id @default(autoincrement())
  publicId        String   @unique
  workspaceId     BigInt
  userId          BigInt?

  resourceId      BigInt?
  notificationType String
  title           String
  body            String?
  channel         String   // in_app | email | webhook
  status          String   // unread | read | dismissed | sent | failed

  createdAt       DateTime @default(now())
  readAt          DateTime?

  @@index([workspaceId, userId, status])
}

model NotificationRule {
  id              BigInt   @id @default(autoincrement())
  publicId        String   @unique
  workspaceId     BigInt

  name            String
  triggerJson     Json
  channelsJson    Json
  status          String

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId, status])
}
```

Notification requirements:

- Support in-app, email, webhook channels.
- Support notification center.
- Generate notifications from domain events and automation rules.

------

# 22. Plugin System

## 22.1 Plugin Model

```prisma
model Plugin {
  id              BigInt   @id @default(autoincrement())
  publicId        String   @unique

  name            String
  slug            String   @unique
  version         String
  description     String?
  author          String?

  manifestJson    Json
  status          String   // active | disabled | deprecated

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## 22.2 Plugin Installation

Plugin installations should be resources.

```prisma
model PluginInstallation {
  id              BigInt   @id @default(autoincrement())
  resourceId      BigInt   @unique
  workspaceId     BigInt
  pluginId        BigInt

  status          String   // installed | enabled | disabled | uninstalled
  configJson      Json?
  grantedScopes   Json?
  dataPolicy      String   // retain | export | delete

  installedAt     DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([workspaceId, pluginId])
}
```

## 22.3 Plugin Manifest

Plugin manifest must declare:

- permissions / scopes
- resource types
- relation types
- widgets
- pages
- actions
- automation triggers
- automation actions
- external network access
- sandbox runtime requirements

## 22.4 Plugin Private Data

First implementation should use generic JSONB storage.

```prisma
model PluginData {
  id              BigInt   @id @default(autoincrement())
  publicId        String   @unique
  workspaceId     BigInt
  pluginId        BigInt

  namespace       String
  key             String
  value           Json

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([workspaceId, pluginId, namespace, key])
}
```

Rules:

- Plugins cannot directly access core application tables.
- Plugins can operate core data only through permission-checked APIs.
- Plugin uninstall must support retain, export, and delete strategies.
- Future plugin private schema/table support may be designed later.

------

# 23. Dashboard and Widgets

Dashboard and widgets should be resources when user-visible and configurable.

```prisma
model Dashboard {
  id              BigInt   @id @default(autoincrement())
  resourceId      BigInt   @unique
  workspaceId     BigInt

  name            String
  isDefault       Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId])
}

model DashboardWidget {
  id              BigInt   @id @default(autoincrement())
  resourceId      BigInt   @unique
  workspaceId     BigInt
  dashboardId     BigInt

  widgetType      String
  resourceTypeName String?
  configJson      Json?
  positionJson    Json?
  breakpoint      String   // mobile | tablet | desktop
  visible         Boolean  @default(true)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([workspaceId, dashboardId])
}
```

------

# 24. Migration Strategy

Because destructive refactor is allowed, prioritize clean target schema.

Recommended order:

## Package 1: Foundation Schema

Create:

- Workspace
- WorkspaceMember
- Actor
- ExternalClient
- ApiCredential
- ResourceTypeDefinition
- Resource
- AuditLog
- IdempotencyKey

Seed:

- Default personal workspace for existing users
- Built-in resource type definitions
- Default actors for existing users

## Package 2: Resource-backed Todo and Calendar

Refactor:

- Todo
- Folder
- CalendarEvent
- Recurrence-related tables if present

Add:

- `resourceId`
- `workspaceId`
- Lifecycle timestamp alignment

## Package 3: Relation Graph

Create:

- RelationType
- ResourceRelation

Seed relation types.

Replace polymorphic relation tables using `from_type/from_id/to_type/to_id`.

## Package 4: Events and Webhooks

Create:

- DomainEvent
- WebhookSubscription
- WebhookDelivery

Add:

- Outbox flow
- Async workers
- HMAC signing
- Retry
- Dead-letter
- Manual replay

## Package 5: Audit and Idempotency Integration

Integrate into all write flows:

- actor context
- idempotency middleware/interceptor
- audit service
- domain event creation

## Package 6: Finance Double-entry Refactor

Create/refactor:

- Ledger
- FinanceAccount
- FinanceTransaction
- JournalEntry
- JournalLine
- FinanceEvent

Implement accounting validation.

## Package 7: MCP Server

Add MCP interface with:

- Resource tools
- Todo tools
- Calendar tools
- Finance tools
- Search tools
- Relation tools

Reuse REST auth/authorization/audit/idempotency logic.

## Package 8: Automation and Notifications

Create:

- AutomationRule
- WorkflowRun
- Notification
- NotificationRule

Implement event-driven automation skeleton.

## Package 9: Plugin System

Create:

- Plugin
- PluginInstallation
- PluginData

Add manifest validation and registration for resource types and relation types.

## Package 10: Search and Activity

Create:

- SearchIndex
- ActivityItem
- ResourceNote
- ResourceComment

Add domain-event-driven indexing.

------

# 25. NestJS Module Refactor

Create or refactor these modules:

```text
WorkspaceModule
ActorModule
ExternalClientModule
CredentialModule
AuthorizationModule
ResourceModule
ResourceTypeModule
RelationModule
AuditModule
DomainEventModule
WebhookModule
IdempotencyModule
TodoModule
CalendarModule
FinanceModule
McpModule
AutomationModule
NotificationModule
PluginModule
SearchModule
ActivityModule
```

Shared infrastructure:

```text
WorkspaceContextGuard
ActorContextInterceptor
ScopeGuard
IdempotencyInterceptor
AuditService
DomainEventService
ResourceService
OutboxWorker
WebhookDeliveryWorker
SearchIndexWorker
AutomationWorker
```

Rules:

- Domain services should not manually duplicate audit logic.
- Use shared transaction-aware helpers for:
  - creating resource rows
  - writing audit logs
  - writing domain events
- Avoid circular dependencies between domain modules and ResourceModule.
- Prefer domain events for cross-module reactions.

------

# 26. Testing Requirements

## 26.1 Unit Tests

Add tests for:

- Scope evaluation
- Workspace scoping
- Actor resolution
- Resource type validation
- Relation type validation
- Idempotency conflict behavior
- Audit snapshot/diff creation
- Finance journal balancing
- Webhook HMAC signing
- Plugin manifest validation

## 26.2 Integration Tests

Add tests for:

- User registration creates personal workspace
- Creating todo creates resource + audit + domain event
- External client token can access only scoped resources
- MCP call produces audit log
- Webhook delivery retries and moves to dead-letter
- Resource relation cannot cross workspace boundary
- Finance transaction creates balanced journal entry
- Plugin cannot access data outside granted scopes
- Archive/trash/restore lifecycle works consistently

## 26.3 Security Tests

Add tests for:

- Internal BigInt IDs are never exposed
- External API rejects BigInt IDs
- Workspace isolation
- Revoked credentials cannot access API
- Credential scopes cannot exceed workspace permissions
- Webhook signatures validate correctly
- Idempotency key reuse with different body returns conflict

------

# 27. Acceptance Criteria

The refactor is successful when:

1. All root domain objects are workspace-owned.
2. All externally visible objects use ULID public IDs.
3. All root domain objects that are user-visible/searchable/relatable/API-operable are backed by resources.
4. External clients can be registered and scoped.
5. API credentials are stored as hashes and never exposed after creation.
6. Every write operation has actor context.
7. Every create/update/delete/relate operation creates an audit log.
8. Every create/update/delete/relate operation creates a domain event.
9. Webhooks are delivered asynchronously with HMAC signatures, retries, logs, dead-letter state, and replay support.
10. MCP tools use the same permissions, actor context, audit, and idempotency as REST APIs.
11. Resource relations use resource IDs, not polymorphic from_type/from_id fields.
12. Relation types are validated and can be system-defined or plugin-defined.
13. Finance uses single-currency double-entry accounting.
14. Posted journal entries must balance.
15. Calendar events, finance events, and domain events are separate concepts and separate tables.
16. Plugins declare capabilities through manifest.
17. Plugins cannot directly access core database tables.
18. Search is backed by Postgres FTS/trigram with future vector support.
19. GraphQL is not implemented, but service boundaries do not block future GraphQL resolvers.
20. No internal Agent runtime tables or execution logic are introduced.

------

# 28. Codex Implementation Guidance

When implementing, work package by package.

Do not attempt to modify every domain in one PR.

Recommended PR order:

1. Foundation schema and seed data.
2. Workspace context and actor context.
3. Resource type and resource service.
4. Todo resource migration.
5. Relation graph.
6. Audit/domain event integration.
7. External client and API credential auth.
8. Webhook outbox.
9. Finance double-entry refactor.
10. MCP tools.
11. Automation skeleton.
12. Plugin manifest and plugin data.
13. Search/activity/notes/comments.
14. Final cleanup and regression tests.

For each package:

- Update Prisma schema.
- Create migration.
- Update seed script.
- Add service-layer transaction helpers.
- Add DTOs.
- Add guards/interceptors where required.
- Add tests before moving to next package.
- Keep external API IDs as ULIDs.
- Never expose internal numeric IDs.