# Test Failure Analysis - CourseIdPageComp

## Summary
There are **6 main test failures** caused by 4 core issues in the component and test setup.

---

## Issue 1: Mock User State Not Set Correctly (CRITICAL)
**Affected Tests:** "submits review successfully", "shows error toast", "shows certificate button", "downloads certificate"

### Problem
The test setup is setting:
```javascript
mockAuthState.user = user;  // ❌ WRONG
```

But the component reads from:
```javascript
const user: CAuthUser | null = useAuthStore((state) => state.authUser);  // ✅ Looking for authUser
```

### Impact
- User is never considered logged in inside the component
- Review form doesn't render (`{(user && ... )}` at line 1315)
- Certificate button doesn't render (depends on `user` check at line 790)
- All API calls that require user context are never triggered

### Location
[CourseIDCompTest.test.tsx](CourseIDCompTest.test.tsx#L950) - Test setup around line 950, 958, 1065

---

## Issue 2: Expand/Collapse Section Button Has No aria-label
**Affected Tests:** "expands section and shows lessons", "checks lesson completion"

### Problem
The component renders arrow icons without proper button semantics:

**Current Code** ([CourseIdPageComp.tsx](CourseIdPageComp.tsx#L980-L1000)):
```jsx
{viewSectionId === section?._id ? (
  <IoIosArrowUp
    onClick={() => {
      setViewSection(false)
      setViewSectionId((null));
    }}
    className="cursor-pointer"
  />
) : (
  <IoIosArrowDown
    onClick={() => {
      setViewSection(true)
      setViewSectionId((section?._id));
    }}
    className="cursor-pointer"
  />
)}
```

Test is looking for:
```javascript
const expandButton = screen.getAllByRole("button", {
  name: "expand-section",
})[0];  // ❌ FAILS - No button role, no aria-label
```

### Impact
- Test cannot find the button element
- No `aria-label="expand-section"` attribute exists
- Icons need to be wrapped in a proper `<button>` element for accessibility

### Location
[CourseIdPageComp.tsx](CourseIdPageComp.tsx#L980-L1000) - Section expand/collapse logic

---

## Issue 3: Missing `allLessons` in Default Test Props
**Affected Tests:** "expands section and shows lessons"

### Problem
The test default props don't include `allLessons`:

**Test Setup** ([CourseIDCompTest.test.tsx](CourseIDCompTest.test.tsx#L475)):
```javascript
const defaultProps: any = {
  initialCourse: course,
  initialReviews: reviews,
  allCategories,
  courseCategory,
  relevantCategoryCourses: [course],
  instructorStats,
  userCourseStats,
  otherCoursesByInstructor: [],
  initialTopic: null,
  allSections: sections,
  userProgress,
  // ❌ MISSING: allLessons
};
```

**Component Expectation** ([CourseIdPageComp.tsx](CourseIdPageComp.tsx#L1005-L1010)):
```jsx
const sectionLessons: CLesson[] = (lessons || [])?.filter((l) => l.sectionId === section._id);
// `lessons` is derived from `allLessons` prop
// If allLessons is empty/missing, no lessons render
```

### Data Structure Issue
Test data has lessons nested inside sections:
```javascript
const sections = [
  {
    _id: "section-1",
    title: "JavaScript Basics",
    lessons: [  // ❌ Nested here
      { _id: "lesson-1", title: "Introduction", ... },
      { _id: "lesson-2", title: "Variables", ... },
    ],
  },
];
```

But component expects:
```javascript
const allLessons = [
  { _id: "lesson-1", title: "Introduction", sectionId: "section-1", ... },
  { _id: "lesson-2", title: "Variables", sectionId: "section-1", ... },
];
```

### Impact
- When section is expanded, `getSectionLessons()` filters lessons from `allLessons`
- Since `allLessons` is undefined, no lessons match and nothing renders
- Test cannot find "Introduction" or "Variables" text

### Location
[CourseIDCompTest.test.tsx](CourseIDCompTest.test.tsx#L475-L500) - defaultProps object

---

## Issue 4: Review Form Reference Issue
**Affected Tests:** "submits review successfully"

### Problem
The review form uses correct `handleSubmit` from React Hook Form, but the test submits before the form elements fully register due to timing.

**Test Code** ([CourseIDCompTest.test.tsx](CourseIDCompTest.test.tsx#L978-L1000)):
```javascript
fireEvent.submit(
  screen.getByRole("button", {
    name: "Submit Review",  // ✅ Button exists
  })
);

await waitFor(() => {
  expect(mockedAxios.post).toHaveBeenCalledWith(  // ❌ FAILS - Never called
    "/api/courses/rate/course-123",
```

### Root Cause
Since the user is not properly set in the mock store (Issue #1), the review form isn't rendered at all, so this button doesn't exist to click.

### Location
[CourseIdPageComp.tsx](CourseIdPageComp.tsx#L155-L185) - onSubmit handler

---

## Issue 5: Certificate Download Mock Setup
**Affected Tests:** "downloads certificate successfully"

### Problem
Test tries to spy on `URL.createObjectURL`:

```javascript
const createObjectURL = jest
  .spyOn(URL, "createObjectURL")
  .mockReturnValue("blob:test");
```

But gets error:
```
Property `createObjectURL` does not exist in the provided object
```

This is because `URL` in the test environment (jsdom) doesn't have these methods available to spy on, or the mock wasn't set up properly before the component imported it.

### Location
[CourseIDCompTest.test.tsx](CourseIDCompTest.test.tsx#L1118-L1150)

---

## Quick Fix Summary

| Issue | File | Line | Fix |
|-------|------|------|-----|
| User state property name | CourseIDCompTest.test.tsx | 950, 958, 1065 | Change `mockAuthState.user` → `mockAuthState.authUser` |
| Expand button aria-label | CourseIdPageComp.tsx | 980-1000 | Wrap icons in `<button>` with `aria-label="expand-section"` |
| Missing allLessons prop | CourseIDCompTest.test.tsx | 475-500 | Add `allLessons` to defaultProps with flat array of lessons |
| Lesson data structure | CourseIDCompTest.test.tsx | 430-460 | Flatten lessons to have `sectionId` field, not nested in sections |
| Certificate button mock | CourseIDCompTest.test.tsx | 1118-1150 | Mock `window.URL` properly in jest setup or remove spy |

