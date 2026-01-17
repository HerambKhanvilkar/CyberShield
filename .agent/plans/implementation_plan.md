# Implementation Plan: Fellowship Platform Enhancements

This plan outlines the steps to implement interview scheduling, enhanced mailing systems, better deadline handling, security cleanup, and onboarding transitions.

## Phase 1: Interview Scheduling System
### Backend Updates
1.  **Update Applicant Model** (`backend/models/Applicant.js`):
    *   Add `interviewDetails` field:
        ```javascript
        interviewDetails: {
            scheduledAt: Date,
            meetLink: String, // Google Meet Link
            status: { type: String, enum: ['PENDING', 'SCHEDULED', 'COMPLETED', 'SKIPPED'], default: 'PENDING' },
            scheduledBy: String // Admin email
        }
        ```
2.  **Update Application Routes** (`backend/routes/applicationRoutes.js`):
    *   Add `PUT /admin/schedule-interview` endpoint.
    *   Update `PATCH /admin/status` to validate that an interview has been handled (Scheduled/Skipped) before allowing final Acceptance/Rejection (optional, or just add the UI flow).
    *   Ensure the "Application Status" endpoint (`/api/portal/status`) reflects the "INTERVIEW_SCHEDULED" state if applicable.

### Frontend Updates (`frontend/src/app/applications/page.js`)
1.  **Add Schedule/Skip UI**:
    *   In the Admin Dashboard, for "Pending" applicants, add a "Schedule Interview" button next to/before "Accept/Reject".
    *   **Schedule Modal**:
        *   Date & Time Picker.
        *   Google Meet Link input.
        *   "Confirm Schedule" button -> Calls `schedule-interview` API.
    *   **Skip Option**: "Skip Interview" button -> Sets status to `INTERVIEW_SKIPPED` (internal marker) allowing immediate decision.

## Phase 2: Enhanced Mailing System
### Backend Services (`backend/services/emailService.js`)
1.  **Integrate Mailgun (Existing)**:
    *   Extend the current `emailService.js` with new methods.
2.  **New Email Triggers**:
    *   **Interview Scheduled**:
        *   Subject: "Interview Scheduled: DeepCytes Fellowship"
        *   Body: Details of time, date, and Google Meet link. Explicit instruction to add to their calendar.
    *   **Application Status Update**:
        *   **Accepted**: "Congratulations! You have been accepted..." + Link to Fellowship Portal.
        *   **Rejected**: "Update on your application..." + Link to check status.
    *   **Termination (Fired)**:
        *   Subject: "Fellowship Status Update"
        *   Body: Formal notification of termination/status change to DROPPED/FIRED.
    *   **Promotion**:
        *   Subject: "Congratulations on your Promotion!"
        *   Body: Details of the new role/tier.

### Implementation Details
*   Create standardized HTML templates for these emails in `backend/emailTemplates/` (or inline if simple strings are used currently).

## Phase 3: Deadline Handling & UX
### Frontend Updates (`frontend/src/app/apply/[code]/page.js`)
1.  **Check Deadline**:
    *   On page load, compare `org.endDate` with current date.
2.  **Expired View**:
    *   If expired, **do not** show "Access Denied".
    *   Instead, show a friendly "Application Window Closed" message.
    *   **Integrate Status Check**:
        *   Render the "Check Application Status" component (Email + OTP flow) directly on this page so users who previously applied can still log in/check status.

## Phase 4: Security & Cleanup
### Remove Sensitive Scripts
1.  **Delete** the following files in `backend/` that potentially leak secrets or are redundant:
    *   `checkBothDbs.js`, `checkRealDb.js`
    *   `check_state.js`, `check_user.js`
    *   `clear_db.js`, `clear_hiring_db.js`
    *   `debugOrgs.js`, `delete_stale_user.js`, `delete_user.js`
    *   `find_app.js`, `fixCloudOrg.js`
    *   `inspectRawDocs.js`
    *   `makeAdmin.js`
    *   `test-email.js` (or move to safe local-only folder)
    *   `verifyCount.js`, `wipeHiring.js`
2.  **Verification**: Ensure `package.json` scripts do not rely on these deleted files.

## Phase 5: Onboarding Transition
### Strategy
1.  **Refine Flow**:
    *   Current: Onboarding -> NDA -> Feedback -> Offer -> Resources (End).
    *   New: Onboarding -> NDA -> Feedback -> Offer -> **Activation** -> Fellowship Profile.
2.  **Implementation**:
    *   Add an "Activate Fellowship" action on the final Onboarding step.
    *   This action updates `user.fellowshipStatus` from `ONBOARDING` to `FELLOW` (if not already handled) and redirects `window.location.href = '/FellowshipProfile'`.
    *   Ensure `Navbar` and `middleware` respect this transition immediately.

## Work Order
1.  **Phase 4 (Cleanup)**: Do this first to secure the environment.
2.  **Phase 1 (Interview)**: Backend models -> Frontend UI.
3.  **Phase 2 (Mailing)**: Implement email service methods -> Hook up to Phase 1 triggers & existing status triggers.
4.  **Phase 3 (Deadline)**: Update the public application page.
5.  **Phase 5 (Transition)**: Smooth out the final onboarding step.
