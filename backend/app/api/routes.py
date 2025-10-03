from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.db.database import get_async_session
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.schemas import TaskResponse, TaskCreate, TaskUpdate, AgentResponse
from datetime import datetime

router = APIRouter()

@router.get("/tasks", response_model=List[TaskResponse])
async def get_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_session)
):
    """Get all tasks with optional filtering and pagination."""
    query = select(Task)

    # Apply filters
    if status:
        try:
            status_enum = TaskStatus(status)
            query = query.filter(Task.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    if priority:
        try:
            priority_enum = TaskPriority(priority)
            query = query.filter(Task.priority == priority_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid priority: {priority}")

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Task.title.ilike(search_pattern)) |
            (Task.description.ilike(search_pattern))
        )

    # Apply ordering and pagination
    query = query.order_by(Task.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    tasks = result.scalars().all()

    return tasks

@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: int, db: AsyncSession = Depends(get_async_session)):
    """Get a specific task by ID."""
    result = await db.execute(select(Task).filter(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task

@router.post("/tasks", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """Create a new task."""
    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        priority=task_data.priority,
        due_date=task_data.due_date
    )

    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)

    return new_task

@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: AsyncSession = Depends(get_async_session)
):
    """Update an existing task."""
    result = await db.execute(select(Task).filter(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update fields
    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    task.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(task)

    return task

@router.delete("/tasks/{task_id}")
async def delete_task(task_id: int, db: AsyncSession = Depends(get_async_session)):
    """Delete a task."""
    result = await db.execute(select(Task).filter(Task.id == task_id))
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
    await db.commit()

    return {"message": f"Task '{task.title}' deleted successfully"}

@router.get("/tasks/stats/summary")
async def get_task_stats(db: AsyncSession = Depends(get_async_session)):
    """Get task statistics summary."""
    # Total tasks
    total_result = await db.execute(select(func.count(Task.id)))
    total = total_result.scalar()

    # Tasks by status
    status_result = await db.execute(
        select(Task.status, func.count(Task.id)).group_by(Task.status)
    )
    status_counts = {status.value: count for status, count in status_result.all()}

    # Tasks by priority
    priority_result = await db.execute(
        select(Task.priority, func.count(Task.id)).group_by(Task.priority)
    )
    priority_counts = {priority.value: count for priority, count in priority_result.all()}

    # Overdue tasks
    now = datetime.utcnow()
    overdue_result = await db.execute(
        select(func.count(Task.id)).filter(
            Task.due_date < now,
            Task.status != TaskStatus.DONE
        )
    )
    overdue = overdue_result.scalar()

    return {
        "total_tasks": total,
        "by_status": status_counts,
        "by_priority": priority_counts,
        "overdue_tasks": overdue,
        "timestamp": datetime.utcnow().isoformat()
    }
