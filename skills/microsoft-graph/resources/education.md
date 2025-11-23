# Education - Microsoft Graph API

This resource covers Microsoft Education services including classes, assignments, students, and education-specific features.

## Base Endpoint

`https://graph.microsoft.com/v1.0/education`

## Classes

### List Classes
```http
GET /education/classes
GET /education/me/classes
```

### Get Class
```http
GET /education/classes/{class-id}
```

### Create Class
```http
POST /education/classes
{
  "displayName": "Introduction to Computer Science",
  "description": "CS 101 - Fall 2024",
  "classCode": "CS101-F24",
  "externalName": "Computer Science 101",
  "externalId": "CS101",
  "externalSource": "sis",
  "mailNickname": "cs101-f24"
}
```

**Required Permissions:** `EduRoster.ReadWrite.All`

### Update Class
```http
PATCH /education/classes/{class-id}
{
  "displayName": "Updated Class Name",
  "description": "Updated description"
}
```

### Delete Class
```http
DELETE /education/classes/{class-id}
```

---

## Class Members

### List Class Members
```http
GET /education/classes/{class-id}/members
```

### List Teachers
```http
GET /education/classes/{class-id}/teachers
```

### List Students
```http
GET /education/classes/{class-id}/members?$filter=primaryRole eq 'student'
```

### Add Member
```http
POST /education/classes/{class-id}/members/$ref
{
  "@odata.id": "https://graph.microsoft.com/v1.0/education/users/{user-id}"
}
```

### Add Teacher
```http
POST /education/classes/{class-id}/teachers/$ref
{
  "@odata.id": "https://graph.microsoft.com/v1.0/education/users/{user-id}"
}
```

### Remove Member
```http
DELETE /education/classes/{class-id}/members/{user-id}/$ref
```

---

## Users

### List Education Users
```http
GET /education/users
```

### Get Education User
```http
GET /education/users/{user-id}
GET /education/me
```

### Get User's Classes
```http
GET /education/users/{user-id}/classes
GET /education/me/classes
```

**User properties:**
- `primaryRole` - `student`, `teacher`, `faculty`
- `externalSource` - `sis`, `manual`, `unknownFutureValue`
- `student` - Student-specific data
- `teacher` - Teacher-specific data

---

## Assignments

### List Class Assignments
```http
GET /education/classes/{class-id}/assignments
```

### Get Assignment
```http
GET /education/classes/{class-id}/assignments/{assignment-id}
```

### Create Assignment
```http
POST /education/classes/{class-id}/assignments
{
  "displayName": "Essay on Shakespeare",
  "instructions": {
    "content": "Write a 500-word essay on Hamlet",
    "contentType": "text"
  },
  "dueDateTime": "2024-01-31T23:59:00Z",
  "assignedDateTime": "2024-01-15T08:00:00Z",
  "status": "draft",
  "allowStudentsToAddResourcesToSubmission": true,
  "grading": {
    "@odata.type": "#microsoft.graph.educationAssignmentPointsGradeType",
    "maxPoints": 100
  }
}
```

**Status values:**
- `draft` - Not published
- `published` - Assigned to students
- `assigned` - Published (synonym)

### Publish Assignment
```http
POST /education/classes/{class-id}/assignments/{assignment-id}/publish
```

### Update Assignment
```http
PATCH /education/classes/{class-id}/assignments/{assignment-id}
{
  "dueDateTime": "2024-02-15T23:59:00Z"
}
```

### Delete Assignment
```http
DELETE /education/classes/{class-id}/assignments/{assignment-id}
```

---

## Assignment Resources

### Add Resource to Assignment
```http
POST /education/classes/{class-id}/assignments/{assignment-id}/resources
{
  "distributeForStudentWork": false,
  "resource": {
    "@odata.type": "#microsoft.graph.educationLinkResource",
    "displayName": "Required Reading",
    "link": "https://example.com/article.pdf"
  }
}
```

**Resource types:**
- `educationLinkResource` - Web link
- `educationFileResource` - File
- `educationWordResource` - Word document
- `educationExcelResource` - Excel workbook
- `educationPowerPointResource` - PowerPoint
- `educationMediaResource` - Media file

---

## Submissions

### List Submissions
```http
GET /education/classes/{class-id}/assignments/{assignment-id}/submissions
```

### Get Student's Submission
```http
GET /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}
GET /education/me/assignments/{assignment-id}/submissions/{submission-id}
```

### Submit Assignment
```http
POST /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}/submit
```

### Return Submission (Teacher)
```http
POST /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}/return
```

### Reassign Submission
```http
POST /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}/reassign
```

**Submission status:**
- `working` - Student is working
- `submitted` - Student submitted
- `returned` - Teacher returned with feedback
- `reassigned` - Teacher reassigned for revision

---

## Submission Resources

### Add Resource to Submission
```http
POST /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}/resources
{
  "resource": {
    "@odata.type": "#microsoft.graph.educationFileResource",
    "displayName": "My Essay.docx",
    "file": {
      "odataid": "https://graph.microsoft.com/v1.0/drives/{drive-id}/items/{item-id}"
    }
  }
}
```

---

## Grading

### Grade Submission
```http
PATCH /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}
{
  "grade": {
    "@odata.type": "#microsoft.graph.educationAssignmentPointsGrade",
    "points": 85
  }
}
```

### Add Feedback
```http
POST /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}/outcomes
{
  "@odata.type": "#microsoft.graph.educationFeedbackOutcome",
  "feedback": {
    "text": {
      "content": "Great work! Consider expanding the conclusion.",
      "contentType": "text"
    }
  }
}
```

### Rubric Grading
```http
# Define rubric on assignment
PATCH /education/classes/{class-id}/assignments/{assignment-id}
{
  "rubric": {
    "displayName": "Essay Rubric",
    "description": {
      "content": "Grading rubric for essays"
    },
    "levels": [
      {
        "displayName": "Excellent",
        "description": {"content": "Exceptional work"},
        "grading": {
          "@odata.type": "#microsoft.graph.educationAssignmentPointsGradeType",
          "maxPoints": 100
        }
      }
    ],
    "qualities": [
      {
        "displayName": "Content",
        "description": {"content": "Quality of content"}
      }
    ]
  }
}
```

---

## Categories

### List Categories
```http
GET /education/classes/{class-id}/assignmentCategories
```

### Create Category
```http
POST /education/classes/{class-id}/assignmentCategories
{
  "displayName": "Homework"
}
```

### Assign Category to Assignment
```http
POST /education/classes/{class-id}/assignments/{assignment-id}/categories/$ref
{
  "@odata.id": "https://graph.microsoft.com/v1.0/education/classes/{class-id}/assignmentCategories/{category-id}"
}
```

---

## Schools

### List Schools
```http
GET /education/schools
```

### Get School
```http
GET /education/schools/{school-id}
```

### List School Classes
```http
GET /education/schools/{school-id}/classes
```

### List School Users
```http
GET /education/schools/{school-id}/users
```

---

## Synchronization Profile

### Get Sync Profile
```http
GET /education/synchronizationProfiles/{profile-id}
```

### Start Sync
```http
POST /education/synchronizationProfiles/{profile-id}/start
```

### Pause Sync
```http
POST /education/synchronizationProfiles/{profile-id}/pause
```

---

## Permissions Reference

### Delegated Permissions
- `EduRoster.Read` - Read class rosters
- `EduRoster.ReadWrite` - Read and write class rosters
- `EduRoster.ReadBasic` - Read basic roster info
- `EduAssignments.Read` - Read assignments
- `EduAssignments.ReadWrite` - Read and write assignments
- `EduAssignments.ReadBasic` - Read basic assignment info
- `EduAssignments.ReadWriteBasic` - Read and write basic assignments

### Application Permissions
- `EduRoster.Read.All` - Read all class rosters
- `EduRoster.ReadWrite.All` - Read and write all rosters
- `EduAssignments.Read.All` - Read all assignments
- `EduAssignments.ReadWrite.All` - Read and write all assignments

---

## Common Patterns

### Create Class and Add Students
```http
# 1. Create class
POST /education/classes
{
  "displayName": "Math 101",
  "classCode": "MATH101"
}

# 2. Add teacher
POST /education/classes/{class-id}/teachers/$ref
{
  "@odata.id": "https://graph.microsoft.com/v1.0/education/users/{teacher-id}"
}

# 3. Add students
POST /education/classes/{class-id}/members/$ref
{
  "@odata.id": "https://graph.microsoft.com/v1.0/education/users/{student-id}"
}
```

### Create and Publish Assignment
```http
# 1. Create assignment
POST /education/classes/{class-id}/assignments
{
  "displayName": "Week 1 Homework",
  "status": "draft",
  "dueDateTime": "2024-01-22T23:59:00Z",
  "grading": {
    "@odata.type": "#microsoft.graph.educationAssignmentPointsGradeType",
    "maxPoints": 100
  }
}

# 2. Add resources
POST /education/classes/{class-id}/assignments/{assignment-id}/resources
{...}

# 3. Publish
POST /education/classes/{class-id}/assignments/{assignment-id}/publish
```

### Grade and Return Submission
```http
# 1. Grade submission
PATCH /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}
{
  "grade": {
    "@odata.type": "#microsoft.graph.educationAssignmentPointsGrade",
    "points": 92
  }
}

# 2. Add feedback
POST /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}/outcomes
{
  "@odata.type": "#microsoft.graph.educationFeedbackOutcome",
  "feedback": {"text": {"content": "Excellent work!"}}
}

# 3. Return to student
POST /education/classes/{class-id}/assignments/{assignment-id}/submissions/{submission-id}/return
```

---

## Best Practices

1. **Use SIS integration** when possible for roster management
2. **Publish assignments** only when ready
3. **Use categories** to organize assignments
4. **Provide clear instructions** in assignments
5. **Set due dates** appropriately
6. **Use rubrics** for consistent grading
7. **Provide feedback** with grades
8. **Monitor submission status** regularly
9. **Use draft status** while preparing assignments
10. **Leverage Teams integration** for class collaboration

---

## Integration with Teams for Education

Education classes can be backed by Teams:
- Each class can have an associated Team
- Assignments appear in Teams assignments tab
- Class files stored in SharePoint/Teams
- Use Teams channels for discussions

```http
GET /education/classes/{class-id}/team
```

Returns associated Team if provisioned.
