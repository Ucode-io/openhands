export interface NotionProject {
  id: string;
  name: string;
  notionToken: string;
  databaseId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotionProjectCreate {
  name: string;
  notionToken: string;
  databaseId: string;
}

export interface NotionProjectUpdate {
  name: string;
  notionToken: string;
  databaseId: string;
}
