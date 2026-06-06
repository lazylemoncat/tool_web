## ADDED Requirements

### Requirement: Todo page matches the root prototype
The system SHALL render `/todo` to match `todo.html` in sidebar layout, toolbar, task list, dialogs, Chinese copy, empty states, and responsive behavior using Material Design styling and MUI components.

#### Scenario: User opens Todo
- **WHEN** an authenticated user visits `/todo`
- **THEN** the page displays the Todo sidebar views, folder tree, search, status filters, priority filters, task list, new task action, multi-select action, dialogs, and labels without mojibake

#### Scenario: User opens Todo on mobile
- **WHEN** the viewport is mobile width
- **THEN** the sidebar can be opened and dismissed through the hamburger interaction without covering unusable content

### Requirement: Todo task lifecycle works
The system MUST support creating, editing, deleting, toggling completion, viewing details, and displaying subtasks and tags for Todo items through real Todo APIs.

#### Scenario: User creates a task
- **WHEN** the user submits a valid new task with title, note, priority, due date, folder, tags, recurrence, or related fields supported by the backend
- **THEN** the task is persisted, appears in the current view, and reflects the selected metadata

#### Scenario: User edits or deletes a task
- **WHEN** the user edits or deletes an existing task
- **THEN** the persisted task updates or disappears from the list after confirmation

#### Scenario: User toggles completion
- **WHEN** the user toggles a task completion state
- **THEN** the task moves between active and completed views according to the selected filters

### Requirement: Todo filtering and batch actions work
The system SHALL provide working search, status filters, priority filters, folder filters, tag filters, and batch operations matching the prototype controls.

#### Scenario: User filters tasks
- **WHEN** the user enters a search term or chooses status, priority, folder, or tag filters
- **THEN** the task list reloads or filters to show only matching tasks and updates counts consistently

#### Scenario: User performs batch operations
- **WHEN** the user selects multiple tasks and chooses complete, move, delete, or cancel selection
- **THEN** the selected tasks are updated through backend-supported bulk operations or individual API calls with visible success or error feedback

### Requirement: Todo folder management works
The system MUST support creating, renaming, deleting, reordering, and nesting folders as represented by the prototype, preserving user ownership and task associations.

#### Scenario: User creates or nests a folder
- **WHEN** the user creates a top-level folder or child folder
- **THEN** the folder tree updates and the new folder can be selected for filtering and task creation

#### Scenario: User deletes a folder
- **WHEN** the user confirms deleting a folder
- **THEN** the folder is removed and its tasks remain accessible according to the backend folder-delete behavior
