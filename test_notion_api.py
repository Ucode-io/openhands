#!/usr/bin/env python3
"""Quick test script for Notion API - find all unique statuses and "Not started" tasks."""

import json
import urllib.request
import urllib.error

# Credentials from user
API_KEY = "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"
DATABASE_ID = "215934603d20802f981ddc136fe03ce2"

BASE_URL = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"

def make_request(method, endpoint, data=None):
    """Make a request to the Notion API."""
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }

    if data:
        data = json.dumps(data).encode('utf-8')

    request = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode('utf-8')), None
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        return None, f"HTTP {e.code}: {error_body}"
    except Exception as e:
        return None, str(e)

def extract_title(properties):
    """Extract the title from page properties."""
    for prop_name, prop_value in properties.items():
        if prop_value.get('type') == 'title':
            title_items = prop_value.get('title', [])
            if title_items:
                return ''.join(item.get('plain_text', '') for item in title_items)
    return 'Untitled'

def extract_status(properties):
    """Extract status value from properties."""
    # Try 'Status' property
    for prop_name in ['Status', 'status']:
        prop = properties.get(prop_name, {})
        if prop.get('type') == 'status':
            status = prop.get('status')
            if status:
                return status.get('name')
        elif prop.get('type') == 'select':
            select = prop.get('select')
            if select:
                return select.get('name')
    return None

def main():
    print("=" * 60)
    print("Finding All Unique Statuses in Notion Database")
    print("=" * 60)
    print()

    all_statuses = set()
    not_started_tasks = []
    all_tasks = []

    # Paginate through all results
    has_more = True
    start_cursor = None
    page_num = 0

    while has_more:
        page_num += 1
        query_body = {"page_size": 100}
        if start_cursor:
            query_body["start_cursor"] = start_cursor

        result, error = make_request("POST", f"/databases/{DATABASE_ID}/query", query_body)

        if error:
            print(f"Error: {error}")
            return

        items = result.get('results', [])
        has_more = result.get('has_more', False)
        start_cursor = result.get('next_cursor')

        print(f"Page {page_num}: Found {len(items)} items (has_more: {has_more})")

        for page in items:
            properties = page.get('properties', {})
            title = extract_title(properties)
            status = extract_status(properties)

            all_tasks.append({
                'title': title,
                'status': status,
                'page_id': page['id']
            })

            if status:
                all_statuses.add(status)

            # Check for variations of "not started"
            if status and status.lower() in ['not started', 'not_started', 'notstarted', 'to do', 'todo', 'new', 'open', 'backlog']:
                not_started_tasks.append({
                    'title': title,
                    'status': status,
                    'page_id': page['id']
                })

    print()
    print("=" * 60)
    print(f"TOTAL TASKS: {len(all_tasks)}")
    print("=" * 60)
    print()
    print("ALL UNIQUE STATUS VALUES:")
    print("-" * 40)
    for status in sorted(all_statuses):
        count = sum(1 for t in all_tasks if t['status'] == status)
        print(f"  • {status!r} ({count} tasks)")

    print()
    print("=" * 60)
    print(f"TASKS WITH 'NOT STARTED'-LIKE STATUS: {len(not_started_tasks)}")
    print("=" * 60)

    if not_started_tasks:
        for i, task in enumerate(not_started_tasks[:20], 1):
            print(f"  [{i}] {task['title']}")
            print(f"      Status: {task['status']}")
            print(f"      Page ID: {task['page_id']}")
            print()
    else:
        print("  No tasks found with 'Not started' or similar status.")
        print()
        print("  Possible statuses in your database:")
        for status in sorted(all_statuses):
            print(f"    - {status}")

if __name__ == "__main__":
    main()
