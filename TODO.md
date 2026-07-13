# TODO

- [ ] Inspect current `StaffPortal.jsx` Create Course modal implementation details.
- [ ] Add assessment state in `StaffPortal.jsx` (passing %, time limit, questions array).
- [ ] Build professional assessment UI inside Create Course modal:
  - [ ] Passing % input (0-100)
  - [ ] Time limit (minutes)
  - [ ] Add question blocks
  - [ ] Each question supports prompt + 4 options (A-D) + correct option selector
- [ ] Validate assessment form before creating course.
- [ ] Persist assessment into Firestore `bharatam_courses` document as `assessment` object.
- [ ] Update local course state (`localCourseData`) with `assessment` so trainer sees it immediately.
- [ ] Sanity test: create course without assessment (if allowed) or with assessment; verify Firestore write.

