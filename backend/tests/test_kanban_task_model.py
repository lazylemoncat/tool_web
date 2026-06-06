"""Tests for KanbanTask model and Folder.kanban_config."""

import pytest

import src.models.kanban  # noqa: F401  register kanban tables
import src.models.kanban_task  # noqa: F401  register kanban_task table
import src.models.user  # noqa: F401  register auth tables
from src.models.kanban import KanbanColumn, Sprint
from src.models.kanban_task import KanbanTask
from src.models.todo import Folder
from src.models.user import User


@pytest.fixture
def test_user(db_session):
    user = User(id=1, username="testuser", password_hash="x")
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def test_folder(db_session, test_user):
    folder = Folder(
        id=1,
        user_id=test_user.id,
        name="Kanban Board",
        mode="kanban",
        kanban_config={"columns": ["To Do", "In Progress", "Done"]},
    )
    db_session.add(folder)
    db_session.commit()
    return folder


@pytest.fixture
def test_sprint(db_session, test_user, test_folder):
    sprint = Sprint(
        id=1,
        folder_id=test_folder.id,
        user_id=test_user.id,
        name="Sprint 1",
        status="active",
    )
    db_session.add(sprint)
    db_session.commit()
    return sprint


@pytest.fixture
def test_column(db_session, test_user, test_sprint):
    column = KanbanColumn(
        id=1,
        sprint_id=test_sprint.id,
        user_id=test_user.id,
        name="To Do",
        sort_order=0,
    )
    db_session.add(column)
    db_session.commit()
    return column


class TestKanbanTaskModel:
    def test_create_kanban_task(
        self,
        db_session,
        test_user,
        test_folder,
        test_sprint,
        test_column,
    ):
        """Test creating a KanbanTask with all fields."""
        task = KanbanTask(
            user_id=test_user.id,
            folder_id=test_folder.id,
            sprint_id=test_sprint.id,
            column_id=test_column.id,
            title="Test Task",
            version="1.0",
            task_type="feature",
            priority="P1",
            requirement_desc="User should be able to do X",
            technical_desc="Implement X using Y",
            acceptance_criteria="X works when Z",
            custom_fields={"effort": 5, "assignee": "Alice"},
            sort_order=0,
        )
        db_session.add(task)
        db_session.commit()

        saved = (
            db_session.query(KanbanTask)
            .filter_by(title="Test Task")
            .first()
        )
        assert saved is not None
        assert saved.user_id == test_user.id
        assert saved.folder_id == test_folder.id
        assert saved.sprint_id == test_sprint.id
        assert saved.column_id == test_column.id
        assert saved.title == "Test Task"
        assert saved.version == "1.0"
        assert saved.task_type == "feature"
        assert saved.priority == "P1"
        assert saved.requirement_desc == "User should be able to do X"
        assert saved.technical_desc == "Implement X using Y"
        assert saved.acceptance_criteria == "X works when Z"
        assert saved.custom_fields == {"effort": 5, "assignee": "Alice"}
        assert saved.sort_order == 0
        assert saved.created_at is not None
        assert saved.updated_at is not None

    def test_kanban_task_relationships(
        self,
        db_session,
        test_user,
        test_folder,
        test_sprint,
        test_column,
    ):
        """Test KanbanTask relationships: folder, sprint, kanban_column."""
        task = KanbanTask(
            user_id=test_user.id,
            folder_id=test_folder.id,
            sprint_id=test_sprint.id,
            column_id=test_column.id,
            title="Related Task",
        )
        db_session.add(task)
        db_session.commit()

        saved = (
            db_session.query(KanbanTask)
            .filter_by(title="Related Task")
            .first()
        )
        assert saved.folder.id == test_folder.id
        assert saved.sprint.id == test_sprint.id
        assert saved.kanban_column.id == test_column.id

    def test_folder_kanban_tasks_relationship(
        self,
        db_session,
        test_user,
        test_folder,
        test_sprint,
        test_column,
    ):
        """Test Folder.kanban_tasks back_populates."""
        task1 = KanbanTask(
            user_id=test_user.id,
            folder_id=test_folder.id,
            title="Task 1",
            sort_order=0,
        )
        task2 = KanbanTask(
            user_id=test_user.id,
            folder_id=test_folder.id,
            title="Task 2",
            sort_order=1,
        )
        db_session.add_all([task1, task2])
        db_session.commit()

        folder = db_session.query(Folder).filter_by(id=test_folder.id).first()
        assert len(folder.kanban_tasks) == 2
        titles = {t.title for t in folder.kanban_tasks}
        assert titles == {"Task 1", "Task 2"}

    def test_column_kanban_tasks_relationship(
        self,
        db_session,
        test_user,
        test_folder,
        test_sprint,
        test_column,
    ):
        """Test KanbanColumn.kanban_tasks back_populates."""
        task = KanbanTask(
            user_id=test_user.id,
            folder_id=test_folder.id,
            column_id=test_column.id,
            title="Column Task",
        )
        db_session.add(task)
        db_session.commit()

        column = (
            db_session.query(KanbanColumn)
            .filter_by(id=test_column.id)
            .first()
        )
        assert len(column.kanban_tasks) == 1
        assert column.kanban_tasks[0].title == "Column Task"

    def test_kanban_task_defaults(self, db_session, test_user, test_folder):
        """Test optional field defaults and sort_order default."""
        task = KanbanTask(
            user_id=test_user.id,
            folder_id=test_folder.id,
            title="Minimal Task",
        )
        db_session.add(task)
        db_session.commit()

        saved = (
            db_session.query(KanbanTask)
            .filter_by(title="Minimal Task")
            .first()
        )
        assert saved.sprint_id is None
        assert saved.column_id is None
        assert saved.version is None
        assert saved.task_type is None
        assert saved.priority is None
        assert saved.requirement_desc is None
        assert saved.technical_desc is None
        assert saved.acceptance_criteria is None
        assert saved.custom_fields is None
        assert saved.sort_order == 0
        assert saved.created_at is not None
        assert saved.updated_at is not None

    def test_folder_kanban_config(self, db_session, test_user):
        """Test Folder.kanban_config JSON field."""
        config = {
            "columns": ["To Do", "In Progress", "Done"],
            "wip_limits": {"To Do": 5},
        }
        folder = Folder(
            user_id=test_user.id,
            name="Kanban Board",
            mode="kanban",
            kanban_config=config,
        )
        db_session.add(folder)
        db_session.commit()

        saved = db_session.query(Folder).filter_by(name="Kanban Board").first()
        assert saved.kanban_config == config
        assert saved.kanban_config["columns"] == [
            "To Do",
            "In Progress",
            "Done",
        ]
        assert saved.kanban_config["wip_limits"]["To Do"] == 5

    def test_cascade_delete_folder_removes_kanban_tasks(
        self,
        db_session,
        test_user,
        test_folder,
        test_sprint,
        test_column,
    ):
        """Test that deleting a folder cascades to its kanban_tasks."""
        task = KanbanTask(
            user_id=test_user.id,
            folder_id=test_folder.id,
            title="Cascade Test",
        )
        db_session.add(task)
        db_session.commit()

        folder = db_session.query(Folder).filter_by(id=test_folder.id).first()
        db_session.delete(folder)
        db_session.commit()

        remaining = (
            db_session.query(KanbanTask)
            .filter_by(title="Cascade Test")
            .first()
        )
        assert remaining is None
