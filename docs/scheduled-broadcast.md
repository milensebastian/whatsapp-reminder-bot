# Scheduled Broadcast Example

## Schedule Announcement For A Class
`POST /api/announcements`

Request:
```json
{
  "title": "Exam Announcement",
  "message": "Midterm exam starts at 10:00 AM. Please report by 9:30 AM.",
  "priority": "high",
  "targetScope": "class",
  "targetClassId": "67d2class001",
  "scheduleDate": "2026-03-20",
  "scheduleTime": "09:00"
}
```

Response:
```json
{
  "success": true,
  "message": "Announcement scheduled successfully",
  "data": {
    "_id": "67d3sched001",
    "title": "Exam Announcement",
    "message": "Midterm exam starts at 10:00 AM. Please report by 9:30 AM.",
    "targetClass": "67d2class001",
    "sendTime": "2026-03-20T09:00:00.000Z",
    "type": "announcement",
    "status": "pending"
  }
}
```

## Scheduled Broadcast Job
File: `jobs/scheduledBroadcastJob.js`

Schedule:
- Every minute: `* * * * *`

Logic:
- Finds scheduled messages with `sendTime <= now` and `status = pending`
- Sends to all members of the selected class
- Marks the scheduled message as `sent`
