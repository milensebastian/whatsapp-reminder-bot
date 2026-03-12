# Notify API Documentation

Base URL: `http://localhost:3000`

All API responses use JSON.

## POST /api/tasks
Create a new task and optionally send WhatsApp notifications to assigned users.

### Request Body
```json
{
  "title": "Cybersecurity Assignment",
  "description": "Submit the phishing case study before the deadline.",
  "deadline": "2026-03-20T18:00:00.000Z",
  "priority": "high",
  "assignedUsers": [
    {
      "name": "Aarav",
      "phone": "919876543210"
    },
    {
      "name": "Diya",
      "phone": "919812345678"
    }
  ],
  "autoSend": true
}
```

### Success Response
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "67d18f4db1282e8b6b0a1001",
    "title": "Cybersecurity Assignment",
    "description": "Submit the phishing case study before the deadline.",
    "deadline": "2026-03-20T18:00:00.000Z",
    "priority": "high",
    "status": "active",
    "assignedUsers": [
      {
        "name": "Aarav",
        "phone": "919876543210",
        "status": "pending"
      }
    ],
    "createdAt": "2026-03-12T14:00:00.000Z",
    "updatedAt": "2026-03-12T14:00:00.000Z"
  }
}
```

## GET /api/tasks
Fetch tasks. If `phone` is passed as a query param, returns tasks for that user. Otherwise returns recent tasks.

### Example Request
`GET /api/tasks`

### Example Request With Filter
`GET /api/tasks?phone=919876543210`

### Success Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "67d18f4db1282e8b6b0a1001",
      "title": "Cybersecurity Assignment",
      "description": "Submit the phishing case study before the deadline.",
      "deadline": "2026-03-20T18:00:00.000Z",
      "priority": "high",
      "status": "active"
    }
  ]
}
```

## POST /api/announcements
Create and optionally broadcast an announcement.

### Request Body
```json
{
  "title": "System Maintenance Tonight",
  "message": "The Notify platform will be under maintenance from 10 PM to 11 PM.",
  "priority": "critical",
  "targetUsers": [
    {
      "name": "Aarav",
      "phone": "919876543210"
    }
  ],
  "autoSend": true
}
```

### Success Response
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "_id": "67d18fe8b1282e8b6b0a1002",
    "title": "System Maintenance Tonight",
    "message": "The Notify platform will be under maintenance from 10 PM to 11 PM.",
    "priority": "critical",
    "status": "draft",
    "targetUsers": [
      {
        "name": "Aarav",
        "phone": "919876543210",
        "deliveryStatus": "pending"
      }
    ],
    "createdAt": "2026-03-12T14:05:00.000Z",
    "updatedAt": "2026-03-12T14:05:00.000Z"
  }
}
```

## GET /api/announcements
Fetch announcements. If `phone` is passed as a query param, returns announcements for that user. Otherwise returns recent announcements.

### Example Request
`GET /api/announcements`

### Example Request With Filter
`GET /api/announcements?phone=919876543210`

### Success Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "67d18fe8b1282e8b6b0a1002",
      "title": "System Maintenance Tonight",
      "message": "The Notify platform will be under maintenance from 10 PM to 11 PM.",
      "priority": "critical",
      "status": "sent"
    }
  ]
}
```

## POST /api/reminders
Create a reminder from a natural-language message.

### Request Body
```json
{
  "userPhone": "919876543210",
  "sourceMessage": "remind me to buy milk tomorrow at 6pm"
}
```

### Success Response
```json
{
  "success": true,
  "message": "Reminder created successfully",
  "data": {
    "_id": "67d1909bb1282e8b6b0a1003",
    "userPhone": "919876543210",
    "message": "buy milk",
    "reminderTime": "2026-03-13T18:00:00.000Z",
    "repeatType": "none",
    "repeatDay": null,
    "status": "pending",
    "createdAt": "2026-03-12T14:10:00.000Z",
    "updatedAt": "2026-03-12T14:10:00.000Z"
  }
}
```

## GET /api/reminders
Fetch reminders using a phone query.

### Example Request
`GET /api/reminders?phone=919876543210`

### Success Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "67d1909bb1282e8b6b0a1003",
      "userPhone": "919876543210",
      "message": "buy milk",
      "reminderTime": "2026-03-13T18:00:00.000Z",
      "repeatType": "none",
      "repeatDay": null,
      "status": "pending"
    }
  ]
}
```

## POST /webhook
Receive incoming WhatsApp webhook events from WhatsApp Cloud API.

### Request Body
```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "919876543210",
                "id": "wamid.HBgMOTE5ODc2NTQzMjEwFQIAERgSODQ5",
                "timestamp": "1710241800",
                "type": "text",
                "text": {
                  "body": "remind me to buy milk tomorrow at 6pm"
                }
              }
            ],
            "contacts": [
              {
                "profile": {
                  "name": "Aarav"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Success Response
```json
{
  "success": true,
  "message": "Webhook messages processed successfully",
  "processed": 1
}
```

## Common Error Response
```json
{
  "success": false,
  "message": "Internal server error"
}
```
