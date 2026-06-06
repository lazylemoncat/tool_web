## ADDED Requirements

### Requirement: Home page matches the root prototype
The system SHALL render the authenticated home page at `/` to match `index.html` in structure, visual hierarchy, Chinese copy, navigation, dashboard cards, dialogs, and responsive behavior using Material Design styling and MUI components.

#### Scenario: User opens the home dashboard
- **WHEN** an authenticated user visits `/`
- **THEN** the page displays the workbench header, top navigation, Todo card, finance card, monthly finance card, recent tasks card, calendar card, settings card, help card, and matching prototype labels without mojibake

#### Scenario: User navigates from dashboard cards
- **WHEN** the user activates the Todo or finance card
- **THEN** the app routes to `/todo` or `/finance` instead of showing a placeholder message

### Requirement: Home dashboard uses live module summary data
The system MUST display Todo and finance summary values from real application data when the user has data, and MUST display clear loading, empty, and error states when data is unavailable.

#### Scenario: Summary data loads successfully
- **WHEN** Todo and finance summary API calls complete
- **THEN** the dashboard cards show the current active Todo count and current month finance income, expense, and balance

#### Scenario: Summary data fails
- **WHEN** a summary API call fails
- **THEN** the page shows a visible error state and keeps the rest of the dashboard usable

### Requirement: Home dashboard management controls are functional
The system SHALL provide working management mode, add-card, remove-card, navigation management, and settings dialogs corresponding to `index.html`.

#### Scenario: User manages dashboard cards
- **WHEN** the user enters management mode, removes a card, or adds an available card
- **THEN** the dashboard updates the visible card set and exits management mode without breaking navigation or summary data

#### Scenario: User opens preference dialogs
- **WHEN** the user opens navigation management or preference settings
- **THEN** the dialog opens with current values, validates user changes, and closes through cancel, save, or close controls
