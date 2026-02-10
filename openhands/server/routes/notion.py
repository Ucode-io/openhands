# IMPORTANT: LEGACY V0 CODE - Deprecated since version 1.0.0, scheduled for removal April 1, 2026
# This file is part of the legacy (V0) implementation of OpenHands and will be removed soon as we complete the migration to V1.
# OpenHands V1 uses the Software Agent SDK for the agentic core and runs a new application server. Please refer to:
#   - V1 agentic core (SDK): https://github.com/OpenHands/software-agent-sdk
#   - V1 application server (in this repo): openhands/app_server/
# Unless you are working on deprecation, please avoid extending this legacy file and consult the V1 codepaths above.
# Tag: Legacy-V0
# This module belongs to the old V0 web server. The V1 application server lives under openhands/app_server/.
"""API routes for Notion bug tracking integration."""

from fastapi import APIRouter, Depends, status, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel, SecretStr

from openhands.core.logger import openhands_logger as logger
from openhands.integrations.notion.notion_service import NotionService
from openhands.server.dependencies import get_dependencies
from openhands.server.user_auth import get_user_settings
from openhands.storage.data_models.settings import Settings

app = APIRouter(prefix='/api/notion', dependencies=get_dependencies())


class NotionTaskResponse(BaseModel):
    """Response model for a Notion task."""

    page_id: str
    title: str
    description: str | None
    status: str | None
    priority: str | None
    url: str


class NotionTaskListResponse(BaseModel):
    """Response model for list of Notion tasks."""

    tasks: list[NotionTaskResponse]
    total: int


class UpdateStatusRequest(BaseModel):
    """Request model for updating task status."""

    page_id: str
    status: str
    status_property_name: str = 'Status'


class UpdateStatusResponse(BaseModel):
    """Response model for status update."""

    success: bool
    message: str


@app.get(
    '/tasks',
    response_model=NotionTaskListResponse,
    responses={
        200: {'description': 'List of Notion tasks'},
        400: {'description': 'Notion integration not configured'},
        500: {'description': 'Error fetching tasks'},
    },
)
async def get_notion_tasks(
    status_filter: str | None = None,
    limit: int = 100,
    settings: Settings = Depends(get_user_settings),
    x_notion_token: str | None = Header(None, alias='X-Notion-Token'),
    x_notion_database_id: str | None = Header(None, alias='X-Notion-Database-Id'),
) -> NotionTaskListResponse | JSONResponse:
    """
    Fetch tasks from the configured Notion database.

    Args:
        status_filter: Optional filter by status (e.g., 'To Do', 'Bug')
        limit: Maximum number of tasks to return (default: 100)
        settings: User settings containing Notion credentials
        x_notion_token: Optional header to override Notion token
        x_notion_database_id: Optional header to override Notion database ID

    Returns:
        List of Notion tasks with ID, title, description, etc.
    """
    try:
        # Determine credentials (headers take precedence)
        api_key = x_notion_token
        database_id = x_notion_database_id

        # Fallback to settings if headers are missing
        if not api_key and settings and settings.notion_api_key:
            api_key = settings.notion_api_key

        if not database_id and settings and settings.notion_database_id:
            database_id = settings.notion_database_id

        # Check configuration
        if not api_key:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={'error': 'Notion API key not configured'},
            )

        if not database_id:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={'error': 'Notion database ID not configured'},
            )

        # Create Notion service and fetch tasks
        notion_service = NotionService(
            api_key=api_key,
            database_id=database_id,
        )

        bugs = notion_service.list_bugs(
            status_filter=status_filter,
            limit=limit,
        )

        tasks = [
            NotionTaskResponse(
                page_id=bug.page_id,
                title=bug.title,
                description=bug.description,
                status=bug.status,
                priority=bug.priority,
                url=bug.url,
            )
            for bug in bugs
        ]

        return NotionTaskListResponse(tasks=tasks, total=len(tasks))

    except ValueError as e:
        logger.error(f'Notion configuration error: {e}')
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={'error': str(e)},
        )
    except RuntimeError as e:
        logger.error(f'Error fetching Notion tasks: {e}')
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={'error': str(e)},
        )
    except Exception as e:
        logger.error(f'Unexpected error fetching Notion tasks: {e}')
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={'error': 'An unexpected error occurred'},
        )


@app.post(
    '/update-status',
    response_model=UpdateStatusResponse,
    responses={
        200: {'description': 'Status updated successfully'},
        400: {'description': 'Notion integration not configured or invalid request'},
        500: {'description': 'Error updating status'},
    },
)
async def update_notion_status(
    request: UpdateStatusRequest,
    settings: Settings = Depends(get_user_settings),
    x_notion_token: str | None = Header(None, alias='X-Notion-Token'),
    x_notion_database_id: str | None = Header(None, alias='X-Notion-Database-Id'),
) -> UpdateStatusResponse | JSONResponse:
    """
    Update the status of a Notion task.

    Args:
        request: Contains page_id, status, and optional status_property_name
        settings: User settings containing Notion credentials
        x_notion_token: Optional header to override Notion token
        x_notion_database_id: Optional header to override Notion database ID

    Returns:
        Success response or error message
    """
    try:
        # Determine credentials (headers take precedence)
        api_key = x_notion_token
        database_id = x_notion_database_id

        # Fallback to settings if headers are missing
        if not api_key and settings and settings.notion_api_key:
            api_key = settings.notion_api_key

        if not database_id and settings and settings.notion_database_id:
            database_id = settings.notion_database_id

        if not api_key:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={'error': 'Notion API key not configured'},
            )

        # Create Notion service and update status
        notion_service = NotionService(
            api_key=api_key,
            database_id=database_id,
        )

        success = notion_service.update_bug_status(
            page_id=request.page_id,
            status=request.status,
            status_property_name=request.status_property_name,
        )

        if success:
            logger.info(f'Updated Notion task {request.page_id} to status {request.status}')
            return UpdateStatusResponse(
                success=True,
                message=f'Task status updated to {request.status}',
            )
        else:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={'error': 'Failed to update task status'},
            )

    except RuntimeError as e:
        logger.error(f'Error updating Notion task status: {e}')
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={'error': str(e)},
        )
    except Exception as e:
        logger.error(f'Unexpected error updating Notion task: {e}')
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={'error': 'An unexpected error occurred'},
        )


@app.get(
    '/test-connection',
    responses={
        200: {'description': 'Connection test result'},
        400: {'description': 'Notion integration not configured'},
    },
)
async def test_notion_connection(
    settings: Settings = Depends(get_user_settings),
    x_notion_token: str | None = Header(None, alias='X-Notion-Token'),
    x_notion_database_id: str | None = Header(None, alias='X-Notion-Database-Id'),
) -> JSONResponse:
    """
    Test the connection to Notion API.

    Args:
        settings: User settings containing Notion credentials
        x_notion_token: Optional header to override Notion token
        x_notion_database_id: Optional header to override Notion database ID

    Returns:
        Connection test result
    """
    try:
        # Determine credentials (headers take precedence)
        api_key = x_notion_token
        database_id = x_notion_database_id

        # Fallback to settings if headers are missing
        if not api_key and settings and settings.notion_api_key:
            api_key = settings.notion_api_key

        if not database_id and settings and settings.notion_database_id:
            database_id = settings.notion_database_id

        if not api_key:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={'connected': False, 'error': 'Notion API key not configured'},
            )

        # Debug: Log API key info (only first/last few chars for security)
        api_key_value = api_key.get_secret_value() if isinstance(api_key, SecretStr) else str(api_key)
        key_preview = f'{api_key_value[:8]}...{api_key_value[-4:]}' if len(api_key_value) > 12 else '***'
        logger.info(f'Testing Notion connection with key: {key_preview}, database: {database_id}')

        # Create Notion service and test connection
        notion_service = NotionService(
            api_key=api_key,
            database_id=database_id,
        )

        is_connected, error_message = notion_service.test_connection()

        if is_connected:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    'connected': True,
                    'message': 'Connected to Notion API',
                },
            )
        else:
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={
                    'connected': False,
                    'message': 'Failed to connect to Notion API',
                    'error': error_message,
                },
            )

    except Exception as e:
        logger.error(f'Error testing Notion connection: {e}')
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={'connected': False, 'error': str(e)},
        )
