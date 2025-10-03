from typing import Optional, List, Dict, Any
from langchain_core.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.schemas import TaskCreate, TaskUpdate
from app.db.database import async_session
from datetime import datetime, timedelta
import json
import asyncio


async def get_db_session():
    async with async_session() as session:
        return session


@tool
async def create_task(
    title: str,
    description: Optional[str] = None,
    priority: Optional[str] = "medium",
    due_date: Optional[str] = None,
) -> str:
    """
    Create a new task with the given parameters.

    Args:
        title: The title/name of the task (required)
        description: Detailed description of the task (optional)
        priority: Task priority - low, medium, high, urgent (default: medium)
        due_date: Due date in ISO format YYYY-MM-DD or natural language like 'tomorrow', 'next week'

    Returns:
        JSON string with task creation result
    """
    try:
        async with async_session() as session:
            # Parse due_date if provided
            parsed_due_date = None
            if due_date:
                parsed_due_date = parse_due_date(due_date)

            # Validate priority
            if priority not in ["low", "medium", "high", "urgent"]:
                priority = "medium"

            # Create new task
            new_task = Task(
                title=title,
                description=description,
                priority=TaskPriority(priority),
                due_date=parsed_due_date,
                status=TaskStatus.PENDING,
            )

            session.add(new_task)
            await session.commit()
            await session.refresh(new_task)

            result = {
                "success": True,
                "message": f"Task '{title}' created successfully",
                "task_id": new_task.id,
                "task": new_task.to_dict(),
            }
            return json.dumps(result)

    except Exception as e:
        result = {
            "success": False,
            "message": f"Error creating task: {str(e)}",
            "task_id": None,
            "task": None,
        }
        return json.dumps(result)


@tool
async def update_task(
    task_identifier: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    due_date: Optional[str] = None,
) -> str:
    """
    Update an existing task. Can identify task by ID or title.

    Args:
        task_identifier: Task ID (number) or task title (string) to identify which task to update
        title: New title for the task (optional)
        description: New description for the task (optional)
        status: New status - pending, in_progress, done, cancelled (optional)
        priority: New priority - low, medium, high, urgent (optional)
        due_date: New due date in ISO format or natural language (optional)

    Returns:
        JSON string with update result
    """
    try:
        async with async_session() as session:
            # Find task by ID or title
            task = None
            if task_identifier.isdigit():
                # Search by ID
                task_id = int(task_identifier)
                result = await session.execute(select(Task).filter(Task.id == task_id))
                task = result.scalar_one_or_none()
            else:
                # Search by title (case-insensitive, partial match)
                result = await session.execute(
                    select(Task).filter(Task.title.ilike(f"%{task_identifier}%"))
                )
                task = result.scalar_one_or_none()

            if not task:
                result = {
                    "success": False,
                    "message": f"Task '{task_identifier}' not found",
                    "task_id": None,
                    "task": None,
                }
                return json.dumps(result)

            # Update fields if provided
            updates = {}
            if title:
                updates["title"] = title
            if description is not None:
                updates["description"] = description
            if status and status in ["pending", "in_progress", "done", "cancelled"]:
                updates["status"] = TaskStatus(status)
            if priority and priority in ["low", "medium", "high", "urgent"]:
                updates["priority"] = TaskPriority(priority)
            if due_date:
                updates["due_date"] = parse_due_date(due_date)

            if updates:
                updates["updated_at"] = datetime.utcnow()
                await session.execute(
                    update(Task).where(Task.id == task.id).values(**updates)
                )
                await session.commit()

                # Refresh task to get updated data
                await session.refresh(task)

            result = {
                "success": True,
                "message": f"Task '{task.title}' updated successfully",
                "task_id": task.id,
                "task": task.to_dict(),
            }
            return json.dumps(result)

    except Exception as e:
        result = {
            "success": False,
            "message": f"Error updating task: {str(e)}",
            "task_id": None,
            "task": None,
        }
        return json.dumps(result)


@tool
async def delete_task(task_identifier: str) -> str:
    """
    Delete a task by ID or title.

    Args:
        task_identifier: Task ID (number) or task title (string) to identify which task to delete

    Returns:
        JSON string with deletion result
    """
    try:
        async with async_session() as session:
            # Find task by ID or title
            task = None
            if task_identifier.isdigit():
                task_id = int(task_identifier)
                result = await session.execute(select(Task).filter(Task.id == task_id))
                task = result.scalar_one_or_none()
            else:
                result = await session.execute(
                    select(Task).filter(Task.title.ilike(f"%{task_identifier}%"))
                )
                task = result.scalar_one_or_none()

            if not task:
                result = {
                    "success": False,
                    "message": f"Task '{task_identifier}' not found",
                    "task_id": None,
                }
                return json.dumps(result)

            task_title = task.title
            task_id = task.id

            await session.execute(delete(Task).where(Task.id == task.id))
            await session.commit()

            result = {
                "success": True,
                "message": f"Task '{task_title}' deleted successfully",
                "task_id": task_id,
            }
            return json.dumps(result)

    except Exception as e:
        result = {
            "success": False,
            "message": f"Error deleting task: {str(e)}",
            "task_id": None,
        }
        return json.dumps(result)


@tool
async def list_tasks(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    limit: Optional[int] = 20,
) -> str:
    """
    List all tasks with optional filtering.

    Args:
        status_filter: Filter by status - pending, in_progress, done, cancelled (optional)
        priority_filter: Filter by priority - low, medium, high, urgent (optional)
        limit: Maximum number of tasks to return (default: 20)

    Returns:
        JSON string with list of tasks
    """
    try:
        async with async_session() as session:
            query = select(Task).order_by(Task.created_at.desc())

            # Apply filters
            if status_filter and status_filter in [
                "pending",
                "in_progress",
                "done",
                "cancelled",
            ]:
                query = query.filter(Task.status == TaskStatus(status_filter))

            if priority_filter and priority_filter in [
                "low",
                "medium",
                "high",
                "urgent",
            ]:
                query = query.filter(Task.priority == TaskPriority(priority_filter))

            # Apply limit
            if limit:
                query = query.limit(limit)

            result = await session.execute(query)
            tasks = result.scalars().all()

            task_list = [task.to_dict() for task in tasks]

            result = {
                "success": True,
                "message": f"Retrieved {len(task_list)} tasks",
                "count": len(task_list),
                "tasks": task_list,
            }
            return json.dumps(result)

    except Exception as e:
        result = {
            "success": False,
            "message": f"Error retrieving tasks: {str(e)}",
            "count": 0,
            "tasks": [],
        }
        return json.dumps(result)


@tool
async def filter_tasks(
    search_text: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    overdue: Optional[bool] = None,
) -> str:
    """
    Filter tasks based on various criteria including text search.

    Args:
        search_text: Search in task title and description (optional)
        status: Filter by status - pending, in_progress, done, cancelled (optional)
        priority: Filter by priority - low, medium, high, urgent (optional)
        overdue: Filter overdue tasks (True) or not overdue (False) (optional)

    Returns:
        JSON string with filtered tasks
    """
    try:
        async with async_session() as session:
            query = select(Task)

            # Text search in title and description
            if search_text:
                search_pattern = f"%{search_text}%"
                query = query.filter(
                    (Task.title.ilike(search_pattern))
                    | (Task.description.ilike(search_pattern))
                )

            # Status filter
            if status and status in ["pending", "in_progress", "done", "cancelled"]:
                query = query.filter(Task.status == TaskStatus(status))

            # Priority filter
            if priority and priority in ["low", "medium", "high", "urgent"]:
                query = query.filter(Task.priority == TaskPriority(priority))

            # Overdue filter
            if overdue is not None:
                now = datetime.utcnow()
                if overdue:
                    query = query.filter(
                        Task.due_date < now, Task.status != TaskStatus.DONE
                    )
                else:
                    query = query.filter(
                        (Task.due_date >= now) | (Task.due_date.is_(None))
                    )

            query = query.order_by(Task.created_at.desc())
            result = await session.execute(query)
            tasks = result.scalars().all()

            task_list = [task.to_dict() for task in tasks]

            result = {
                "success": True,
                "message": f"Found {len(task_list)} tasks matching criteria",
                "count": len(task_list),
                "tasks": task_list,
            }
            return json.dumps(result)

    except Exception as e:
        result = {
            "success": False,
            "message": f"Error filtering tasks: {str(e)}",
            "count": 0,
            "tasks": [],
        }
        return json.dumps(result)


def parse_due_date(due_date_str: str) -> Optional[datetime]:
    """Parse natural language due date strings into datetime objects."""
    if not due_date_str:
        return None

    due_date_str = due_date_str.lower().strip()
    now = datetime.utcnow()

    # Handle common natural language patterns
    if due_date_str in ["today", "now"]:
        return now.replace(hour=23, minute=59, second=59)
    elif due_date_str in ["tomorrow", "tmr"]:
        return (now + timedelta(days=1)).replace(hour=23, minute=59, second=59)
    elif "next week" in due_date_str:
        return (now + timedelta(weeks=1)).replace(hour=23, minute=59, second=59)
    elif "next month" in due_date_str:
        return (now + timedelta(days=30)).replace(hour=23, minute=59, second=59)

    # Try to parse ISO format
    try:
        if "T" in due_date_str:
            return datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
        else:
            # Assume date only, set to end of day
            parsed_date = datetime.fromisoformat(due_date_str)
            return parsed_date.replace(hour=23, minute=59, second=59)
    except ValueError:
        pass

    # If all else fails, return tomorrow
    return (now + timedelta(days=1)).replace(hour=23, minute=59, second=59)


# Export all tools
TASK_TOOLS = [create_task, update_task, delete_task, list_tasks, filter_tasks]
