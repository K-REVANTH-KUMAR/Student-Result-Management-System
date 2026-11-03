# React component structure

Each UI component is kept in its own JSX file and grouped by feature:

- `auth/` — Login
- `common/` — SectionHeading, StatCard, Field, Modal
- `dashboard/` — AdminDashboard, TeacherDashboard
- `users/` — UserManagement, Directory
- `subjects/` — SubjectManagement
- `marks/` — MarksManagement, EnterMarks
- `results/` — StudentResults
- `profile/` — Profile

`App.jsx` remains the application shell. It imports the feature components and controls the main navigation.
