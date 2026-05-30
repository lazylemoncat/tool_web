# PlantUML Templates

## 1. Class diagram

```plantuml
@startuml
title <Scope> - class diagram

' Scope: <scope>
' Evidence:
' - <file>
' Assumptions:
' - <assumption>

package "<package>" {
  interface <InterfaceName>
  class <ClassName>
  enum <EnumName>
}

<InterfaceName> <|.. <ClassName>
<ClassName> --> <DependencyName> : uses

@enduml
```

## 2. Object diagram

```plantuml
@startuml
title <Scenario> - object diagram

' Scope: <scope>
' Evidence:
' - <file>
' Assumptions:
' - Object values come from fixtures/tests.

object "order: Order" as order {
  id = "ord_123"
  status = "PAID"
}

object "payment: Payment" as payment {
  status = "CAPTURED"
}

order --> payment : payment

@enduml
```

## 3. Package diagram

```plantuml
@startuml
title <Scope> - package dependency diagram

' Scope: <scope>
' Evidence:
' - <file>

package "api" as api
package "application" as app
package "domain" as domain
package "infrastructure" as infra

api --> app
app --> domain
app --> infra
infra --> domain

@enduml
```

## 4. Component diagram

```plantuml
@startuml
title <Scope> - component diagram

' Scope: <scope>
' Evidence:
' - <file>

component "Web API" as Web
component "Order Service" as Order
database "PostgreSQL" <<database>> as DB
queue "Kafka" <<queue>> as Kafka
component "Payment Provider" <<external>> as Pay

Web --> Order
Order --> DB
Order --> Kafka
Order --> Pay

@enduml
```

## 5. Deployment diagram

```plantuml
@startuml
title <Environment> - deployment diagram

' Scope: <scope>
' Evidence:
' - <file>

node "Kubernetes Cluster" {
  node "api pod" {
    component "api container" as API
  }
  node "worker pod" {
    component "worker container" as Worker
  }
}

database "Managed PostgreSQL" <<database>> as DB
queue "Managed Kafka" <<queue>> as Kafka

API --> DB
API --> Kafka
Worker --> Kafka

@enduml
```

## 6. Composite structure diagram approximation

```plantuml
@startuml
title <Component> - composite structure diagram

' Scope: <scope>
' Evidence:
' - <file>
' Assumptions:
' - PlantUML approximation using components and ports.

component "<Component>" as C {
  portin "input port" as In
  portout "output port" as Out

  component "Application Service" as App
  component "Repository Adapter" as Repo
  component "External Client Adapter" as Client

  In --> App
  App --> Repo
  App --> Client
  App --> Out
}

@enduml
```

## 7. Profile diagram approximation

```plantuml
@startuml
title Project UML profile

' Scope: modeling conventions
' Evidence:
' - docs/architecture.md

class External <<stereotype>> {
  taggedValue: systemOwner
}

class Database <<stereotype>> {
  taggedValue: engine
}

class Queue <<stereotype>> {
  taggedValue: deliverySemantics
}

@enduml
```

## 8. Use case diagram

```plantuml
@startuml
title <System> - use case diagram

' Scope: <scope>
' Evidence:
' - <file>

left to right direction

actor "Customer" as Customer
actor "Admin" as Admin

rectangle "<System>" {
  usecase "Place order" as UC1
  usecase "Pay for order" as UC2
  usecase "Refund payment" as UC3
  usecase "Manage catalog" as UC4
}

Customer --> UC1
Customer --> UC2
Admin --> UC3
Admin --> UC4
UC1 .> UC2 : <<include>>

@enduml
```

## 9. Activity diagram

```plantuml
@startuml
title <Workflow> - activity diagram

' Scope: <scope>
' Evidence:
' - <file>

start
:Receive request;
:Validate input;

if (Valid?) then (yes)
  :Execute business operation;
  if (External call succeeds?) then (yes)
    :Persist result;
    :Return success;
  else (no)
    :Return recoverable error;
  endif
else (no)
  :Return validation error;
endif

stop

@enduml
```

## 10. State machine diagram

```plantuml
@startuml
title <Entity> - state machine diagram

' Scope: <scope>
' Evidence:
' - <file>

[*] --> Created
Created --> Authorized : authorize()
Authorized --> Captured : capture()
Authorized --> Failed : decline()
Captured --> Refunded : refund()
Failed --> [*]
Refunded --> [*]

@enduml
```

## 11. Sequence diagram

```plantuml
@startuml
title <Use case> - sequence diagram

' Scope: <scope>
' Evidence:
' - <file>

actor User
participant "Controller" as Controller
participant "Service" as Service
database "Database" as DB
component "External API" <<external>> as External

User -> Controller: request
Controller -> Service: execute(command)
Service -> DB: load data
Service -> External: call API

alt success
  External --> Service: ok
  Service -> DB: save result
  Service --> Controller: success
else failure
  External --> Service: error
  Service --> Controller: failure
end

Controller --> User: response

@enduml
```

## 12. Communication diagram approximation

```plantuml
@startuml
title <Use case> - communication diagram

' Scope: <scope>
' Evidence:
' - <file>
' Assumptions:
' - Approximated using object/component links with numbered messages.

object "user: User" as User
object "controller: Controller" as Controller
object "service: Service" as Service
object "repository: Repository" as Repo

User --> Controller : 1. request
Controller --> Service : 2. execute(command)
Service --> Repo : 3. save(entity)
Service --> Controller : 4. result
Controller --> User : 5. response

@enduml
```

## 13. Interaction overview diagram approximation

```plantuml
@startuml
title <Workflow> - interaction overview diagram

' Scope: <scope>
' Evidence:
' - <file>
' Assumptions:
' - Approximated with activity nodes that reference sequence diagrams.

start
:Interaction: authenticate user\nSee sequence/authentication.puml;
if (Authenticated?) then (yes)
  :Interaction: execute checkout\nSee sequence/checkout.puml;
  :Interaction: publish order event\nSee sequence/order-event.puml;
else (no)
  :Return unauthorized;
endif
stop

@enduml
```

## 14. Timing diagram

```plantuml
@startuml
title <Protocol> - timing diagram

' Scope: <scope>
' Evidence:
' - <file>

robust "Client" as Client
robust "Server" as Server

@0
Client is Idle
Server is Idle

@10
Client is Waiting
Server is Processing

@20
Server is Responding

@30
Client is Done
Server is Idle

@enduml
```

## 15. ERD / database schema diagram

```plantuml
@startuml
title <Schema> - ER diagram

' Scope: <scope>
' Evidence:
' - <migration-file>

entity "users" as users {
  * id : uuid <<PK>>
  --
  email : varchar
  created_at : timestamp
}

entity "orders" as orders {
  * id : uuid <<PK>>
  --
  user_id : uuid <<FK>>
  status : varchar
  created_at : timestamp
}

users ||--o{ orders : places

@enduml
```

## 16. C4 diagram approximation

```plantuml
@startuml
title <System> - C4 container diagram approximation

' Scope: <scope>
' Evidence:
' - <file>
' Assumptions:
' - Approximated with PlantUML components because C4 library availability is unknown.

actor "User" as User
component "Web Application" <<container>> as Web
component "API Service" <<container>> as API
database "Database" <<container/database>> as DB
component "Payment Provider" <<external system>> as Payment

User --> Web
Web --> API : HTTPS/JSON
API --> DB : SQL
API --> Payment : HTTPS

@enduml
```

## 17. DFD approximation

```plantuml
@startuml
title <Scope> - data flow diagram

' Scope: <scope>
' Evidence:
' - <file>
' Assumptions:
' - Approximated using components and data stores.

actor "External User" as User
component "Collect Order Data" <<process>> as P1
database "Order Store" <<data store>> as D1
component "Payment Provider" <<external entity>> as E1

User --> P1 : order details
P1 --> D1 : validated order
P1 --> E1 : payment data
E1 --> P1 : authorization result

@enduml
```

## 18. Flowchart

```plantuml
@startuml
title <Procedure> - flowchart

' Scope: <scope>
' Evidence:
' - <file>

start
:Read input;
if (Input valid?) then (yes)
  :Process input;
  :Write output;
else (no)
  :Report error;
endif
stop

@enduml
```

## 19. API dependency diagram

```plantuml
@startuml
title <API> - dependency diagram

' Scope: <scope>
' Evidence:
' - <route-file>
' - <service-file>

component "POST /orders" <<endpoint>> as PostOrders
component "OrderController" as Controller
component "OrderService" as Service
database "PostgreSQL" <<database>> as DB
component "PaymentClient" as PaymentClient
component "Payment API" <<external>> as PaymentAPI

PostOrders --> Controller
Controller --> Service
Service --> DB
Service --> PaymentClient
PaymentClient --> PaymentAPI

@enduml
```

## 20. Event flow diagram

```plantuml
@startuml
title <Workflow> - event flow diagram

' Scope: <scope>
' Evidence:
' - <producer-file>
' - <consumer-file>

component "OrderService" <<producer>> as OrderService
queue "order.created" <<topic>> as OrderCreated
component "BillingWorker" <<consumer>> as BillingWorker
component "EmailWorker" <<consumer>> as EmailWorker
database "Billing DB" <<database>> as BillingDB

OrderService --> OrderCreated : publishes OrderCreated
OrderCreated --> BillingWorker : consumes
OrderCreated --> EmailWorker : consumes
BillingWorker --> BillingDB : creates invoice

@enduml
```

## 21. Domain model diagram

```plantuml
@startuml
title <Bounded Context> - domain model diagram

' Scope: <scope>
' Evidence:
' - <file>

package "<Bounded Context>" <<bounded-context>> {
  class Order <<aggregate-root>>
  class OrderLine <<entity>>
  class Money <<value-object>>
  class OrderRepository <<repository>>
  class OrderPlaced <<domain-event>>
}

Order *-- OrderLine
Order *-- Money
OrderRepository --> Order
Order --> OrderPlaced : raises

@enduml
```

## 22. DDD context map

```plantuml
@startuml
title <System> - DDD context map

' Scope: <scope>
' Evidence:
' - <file>

component "Ordering" <<bounded-context>> as Ordering
component "Billing" <<bounded-context>> as Billing
component "Shipping" <<bounded-context>> as Shipping
component "Legacy ERP" <<external>> as ERP
component "Anti-Corruption Layer" <<ACL>> as ACL

Ordering --> Billing : customer/supplier
Ordering --> Shipping : published language
Billing --> ACL
ACL --> ERP

@enduml
```
