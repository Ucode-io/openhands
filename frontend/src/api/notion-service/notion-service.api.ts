import { openHands } from "../open-hands-axios";

/**
 * Represents a task/bug from Notion
 */
export interface NotionTask {
  page_id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  url: string;
}

/**
 * Response from fetching Notion tasks
 */
export interface NotionTaskListResponse {
  tasks: NotionTask[];
  total: number;
}

/**
 * Error response from the API
 */
interface ErrorResponse {
  error: string;
}

/**
 * Request to update task status
 */
export interface UpdateStatusRequest {
  page_id: string;
  status: string;
  status_property_name?: string;
}

/**
 * Response from updating task status
 */
export interface UpdateStatusResponse {
  success: boolean;
  message: string;
}

/**
 * Response from testing Notion connection
 */
export interface ConnectionTestResponse {
  connected: boolean;
  message?: string;
  error?: string;
}

/**
 * Service for interacting with Notion bug tracking integration
 */
class NotionTaskService {
  /**
   * Fetch tasks from the configured Notion database
   * @param statusFilter - Optional filter by status (e.g., 'To Do', 'Bug')
   * @param limit - Maximum number of tasks to return
   * @param credentials - Optional project credentials override
   */
  static async getTasks(
    statusFilter?: string,
    limit: number = 100,
    credentials?: { token: string; databaseId: string },
  ): Promise<NotionTask[]> {
    const params = new URLSearchParams();
    if (statusFilter) {
      params.append("status_filter", statusFilter);
    }
    params.append("limit", limit.toString());

    // Prepare headers if credentials are provided
    const config = credentials ? {
      headers: {
        'X-Notion-Token': credentials.token,
        'X-Notion-Database-Id': credentials.databaseId
      }
    } : undefined;

    try {
      const response = await openHands.get<NotionTaskListResponse | ErrorResponse>(
        `/api/notion/tasks?${params.toString()}`,
        config
      );

      // Check if the response is an error
      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data.tasks;
    } catch (error: unknown) {
      // Handle axios errors
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          throw new Error(axiosError.response.data.error);
        }
      }
      throw error;
    }
  }

  /**
   * Update the status of a Notion task
   * @param pageId - The Notion page ID
   * @param status - The new status value (e.g., 'Done', 'In Progress')
   * @param statusPropertyName - Name of the status property (default: 'Status')
   * @param credentials - Optional project credentials override
   */
  static async updateStatus(
    pageId: string,
    status: string,
    statusPropertyName: string = "Status",
    credentials?: { token: string; databaseId: string },
  ): Promise<UpdateStatusResponse> {
    const request: UpdateStatusRequest = {
      page_id: pageId,
      status,
      status_property_name: statusPropertyName,
    };

    // Prepare headers if credentials are provided
    const config = credentials ? {
      headers: {
        'X-Notion-Token': credentials.token,
        'X-Notion-Database-Id': credentials.databaseId
      }
    } : undefined;

    try {
      const response = await openHands.post<UpdateStatusResponse | ErrorResponse>(
        "/api/notion/update-status",
        request,
        config
      );

      if ('error' in response.data) {
        throw new Error(response.data.error);
      }

      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        if (axiosError.response?.data?.error) {
          throw new Error(axiosError.response.data.error);
        }
      }
      throw error;
    }
  }

  /**
   * Test the connection to Notion API
   * @param credentials - Optional project credentials to test specific project
   */
  static async testConnection(
    credentials?: { token: string; databaseId: string }
  ): Promise<ConnectionTestResponse> {
    // Prepare headers if credentials are provided
    const config = credentials ? {
      headers: {
        'X-Notion-Token': credentials.token,
        'X-Notion-Database-Id': credentials.databaseId
      }
    } : undefined;

    const { data } = await openHands.get<ConnectionTestResponse>(
      "/api/notion/test-connection",
      config
    );
    return data;
  }
}

export default NotionTaskService;
