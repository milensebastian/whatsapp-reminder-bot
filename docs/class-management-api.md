# Class Management API Examples

## Create Class
`POST /api/classes`

Request:
```json
{
  "name": "CYB-Y2-A",
  "year": 2,
  "department": "Cybersecurity",
  "members": []
}
```

Response:
```json
{
  "success": true,
  "message": "Class created successfully",
  "data": {
    "_id": "67d2class001",
    "name": "CYB-Y2-A",
    "year": 2,
    "department": "Cybersecurity",
    "members": [],
    "createdAt": "2026-03-12T18:30:00.000Z",
    "updatedAt": "2026-03-12T18:30:00.000Z"
  }
}
```

## Get Classes
`GET /api/classes`

Response:
```json
{
  "success": true,
  "data": [
    {
      "_id": "67d2class001",
      "name": "CYB-Y2-A",
      "year": 2,
      "department": "Cybersecurity",
      "members": [
        {
          "_id": "67d2user001",
          "name": "Aarav",
          "phone": "919876543210",
          "department": "Cybersecurity",
          "year": 2
        }
      ]
    }
  ]
}
```

## Add Student To Class
`POST /api/classes/:id/add-student`

Request:
```json
{
  "userId": "67d2user001"
}
```

Response:
```json
{
  "success": true,
  "message": "Student added to class",
  "data": {
    "_id": "67d2class001",
    "name": "CYB-Y2-A",
    "year": 2,
    "department": "Cybersecurity",
    "members": [
      {
        "_id": "67d2user001",
        "name": "Aarav",
        "phone": "919876543210"
      }
    ]
  }
}
```

## Remove Student From Class
`POST /api/classes/:id/remove-student`

Request:
```json
{
  "userId": "67d2user001"
}
```

Response:
```json
{
  "success": true,
  "message": "Student removed from class",
  "data": {
    "_id": "67d2class001",
    "members": []
  }
}
```

## Update Class
`PUT /api/classes/:id`

Request:
```json
{
  "name": "CYB-Y2-B",
  "year": 2,
  "department": "Cybersecurity"
}
```

Response:
```json
{
  "success": true,
  "message": "Class updated successfully",
  "data": {
    "_id": "67d2class001",
    "name": "CYB-Y2-B",
    "year": 2,
    "department": "Cybersecurity"
  }
}
```

## Delete Class
`DELETE /api/classes/:id`

Response:
```json
{
  "success": true,
  "message": "Class deleted successfully",
  "data": {
    "deleted": true,
    "id": "67d2class001"
  }
}
```

## Create Task For A Class
`POST /api/tasks`

Request:
```json
{
  "title": "Cybersecurity Assignment",
  "description": "Complete the lab worksheet before Friday.",
  "deadline": "2026-03-20T18:00:00.000Z",
  "priority": "high",
  "targetScope": "class",
  "targetClassId": "67d2class001",
  "autoSend": true
}
```

Response:
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "_id": "67d2task001",
    "title": "Cybersecurity Assignment",
    "targetScope": "class",
    "targetClassId": "67d2class001",
    "targetClassName": "CYB-Y2-A",
    "assignedUsers": [
      {
        "name": "Aarav",
        "phone": "919876543210",
        "status": "pending"
      }
    ]
  }
}
```

## Create Announcement For A Department
`POST /api/announcements`

Request:
```json
{
  "title": "Lab Schedule Change",
  "message": "Tomorrow's lab starts at 10 AM.",
  "priority": "high",
  "targetScope": "department",
  "targetDepartment": "Cybersecurity",
  "autoSend": true
}
```

Response:
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "_id": "67d2ann001",
    "title": "Lab Schedule Change",
    "targetScope": "department",
    "targetDepartment": "Cybersecurity",
    "targetUsers": [
      {
        "name": "Aarav",
        "phone": "919876543210",
        "deliveryStatus": "pending"
      }
    ]
  }
}
```
