# Feature Implementation Handover: CSV Backup & Edit Mode

## Overview
Add CSV backup functionality and edit mode to the Drilling Reports system. This allows reports to be backed up as human-readable CSV files and edited from the Dashboard.

## Project Context

**Repository:** https://github.com/9omallec/Drillers-Reports-v2
**Local Path:** `C:\Users\CRO\Desktop\GitHub App\Drillers-Report`

**Key Files:**
- Report App: `report/app.js` (2,570 lines)
- Dashboard App: `dashboard/dashboard-app.js` (1,161 lines)
- Google Drive Service: `shared/services/googleDrive.js`
- Config: `shared/constants/config.js`

**Current State:**
- Report app creates JSON files and uploads to Google Drive
- Dashboard app syncs and displays reports from Drive
- Both apps use shared Google Drive hooks with scope validation
- Recent fixes: UI responsive design, logo dark mode, button sizing

## Requirements

### 1. CSV Backup Export (Multi-Section Format)

**Location:** Report app - add to submission flow

**Format:** Single CSV file with multiple sections separated by blank lines:

```csv
REPORT INFO
Date,Client,Job Name,Location,Driller,Supervisor
2025-01-15,ABC Corp,Highway Project,Seattle WA,John Smith,Jane Doe

WORK DAYS
Date,Start Time,End Time,Hours Worked,Break Hours,Notes
2025-01-15,08:00,17:00,8.5,0.5,Good progress today

BORINGS
Boring #,Depth (ft),Type,Notes
B-1,45.5,Auger,Hit bedrock at 40ft
B-2,32.0,Auger,Sandy soil throughout

EQUIPMENT
Equipment Name,Hours Used,Notes
Drill Rig,8.5,Good condition
Truck,8.5,Normal wear

SUPPLIES
Item,Quantity,Unit,Notes
Bentonite,50,Bags,Clay additive
Casing,100,Feet,6-inch diameter
```

**Implementation Requirements:**
1. Create CSV generation function that formats report data into multi-section CSV
2. Generate CSV automatically when JSON is uploaded to Drive
3. Upload CSV to same Drive folder with naming: `Report-{Client}-{JobName}-{Date}-Backup.csv`
4. Add "Download CSV Backup" button to report app (next to Print button)
5. CSV should be human-readable in Excel/Notepad if Drive fails

**CSV Generation Logic:**
- Header row for each section
- Empty line between sections
- Escape commas in data fields (wrap in quotes)
- Handle empty arrays gracefully
- Date format: YYYY-MM-DD
- Time format: HH:MM (24-hour)

### 2. Edit Mode for Reports

**Dashboard Changes:**

**A. Modify "View" Button (in report cards)**
Current: Opens modal to view report details
New: Change to "Edit" button that opens Report app in edit mode

```javascript
// Pseudo-code for new Edit button behavior
const handleEditReport = (report) => {
    // Store report data for Report app to read
    localStorage.setItem('editingReport', JSON.stringify({
        reportData: report,
        driveFileId: report.driveFileId,
        driveFileName: report.driveFileName,
        mode: 'edit'
    }));

    // Open Report app in new tab with edit mode flag
    window.open('../report/index.html?mode=edit', '_blank');
};
```

**Report App Changes:**

**A. Detect Edit Mode on Load**
```javascript
// On app initialization
const urlParams = new URLSearchParams(window.location.search);
const isEditMode = urlParams.get('mode') === 'edit';

if (isEditMode) {
    const editData = JSON.parse(localStorage.getItem('editingReport'));
    if (editData) {
        loadReportForEditing(editData);
        localStorage.removeItem('editingReport'); // Clean up
    }
}
```

**B. Load Report Data Into Form**
Pre-populate all form fields:
- Report info (date, client, job name, location, driller, supervisor)
- Work days array (dates, times, hours, breaks, notes)
- Borings array (boring #, depth, type, notes)
- Equipment array (name, hours, notes)
- Supplies array (item, quantity, unit, notes)
- Images array (if any)
- Location string

**C. Change Submit Button Behavior**
- Button text: "Submit Report" → "Update Report" (in edit mode)
- Button color: Keep blue but maybe darker to indicate update
- Add confirmation: "Are you sure you want to update this report? This will overwrite the existing version."

**D. Update/Overwrite Logic**
When saving edited report:
1. Use existing `driveFileId` and `driveFileName` from editData
2. Update JSON file (same name = overwrite in Google Drive)
3. Generate new CSV backup (same name = overwrite)
4. Upload both to Drive with same filenames
5. Show success: "✓ Report updated successfully!"

### 3. Google Drive File Overwrite

**Add to `shared/services/googleDrive.js`:**

```javascript
// New method to update existing file
async updateFile(fileId, fileName, fileContent, mimeType = 'application/json') {
    try {
        if (!this.accessToken) {
            throw new Error('Not signed in to Google Drive');
        }

        window.gapi.client.setToken({ access_token: this.accessToken });
        this.emit('onStatusChange', 'Updating file on Google Drive...');

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const metadata = {
            name: fileName,
            mimeType: mimeType
        };

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            `Content-Type: ${mimeType}\r\n\r\n` +
            fileContent +
            close_delim;

        // Use PATCH to update existing file
        const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&supportsAllDrives=true`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + this.accessToken,
                'Content-Type': 'multipart/related; boundary="' + boundary + '"'
            },
            body: multipartRequestBody
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✓ Update successful:', result);
            this.emit('onStatusChange', '✓ Successfully updated on Google Drive!');
            setTimeout(() => this.emit('onStatusChange', ''), 3000);
            return result;
        } else {
            const errorText = await response.text();
            console.error('Update failed:', response.status, errorText);
            throw new Error('Update failed with status: ' + response.status);
        }
    } catch (error) {
        console.error('Error updating file on Drive:', error);
        this.emit('onStatusChange', '❌ Error updating file on Google Drive');
        this.emit('onError', 'Update failed:\n\n' + error.message);
        throw error;
    }
}
```

**Add to `shared/hooks/useGoogleDrive.js`:**
```javascript
const updateFile = async (fileId, fileName, fileContent, mimeType) => {
    if (driveService) {
        return await driveService.updateFile(fileId, fileName, fileContent, mimeType);
    }
    throw new Error('Drive service not initialized');
};

// Add to return object
return {
    isSignedIn,
    driveStatus,
    isInitialized,
    signIn,
    signOut,
    uploadFile,
    updateFile,  // NEW
    listFiles,
    downloadFile,
    driveService
};
```

### 4. Implementation Steps (In Order)

**Step 1: CSV Generation Utility**
Create function in Report app to generate multi-section CSV from report data

**Step 2: Integrate CSV into Submit Flow**
Modify Report app submission to:
- Upload JSON (existing)
- Generate CSV
- Upload CSV to same folder

**Step 3: Add CSV Download Button**
Add button next to Print that downloads CSV locally (for immediate backup)

**Step 4: Add updateFile Method**
Implement file update functionality in Google Drive service and hook

**Step 5: Dashboard Edit Button**
Change View button to Edit button with localStorage handoff

**Step 6: Report App Edit Mode**
Add edit mode detection and data loading on Report app initialization

**Step 7: Update Report Logic**
Modify submit function to handle both new reports and updates

**Step 8: Testing**
- Test new report submission (JSON + CSV created)
- Test CSV download
- Test editing existing report
- Test update overwrites files correctly
- Test dashboard refresh shows updated data

## Important Notes

### Google Drive API Scopes
- Report app uses: `SCOPES_FULL` (read/write)
- Dashboard uses: `SCOPES_READONLY` (read only)
- Scope validation is in place - don't break it

### File Naming Convention
JSON: `Report-{ClientName}-{JobName}-{Date}.json`
CSV: `Report-{ClientName}-{JobName}-{Date}-Backup.csv`

Both use same base name for easy pairing.

### Data Structure
Report object structure:
```javascript
{
    report: {
        date: "2025-01-15",
        client: "ABC Corp",
        jobName: "Highway Project",
        location: "Seattle, WA",
        driller: "John Smith",
        supervisor: "Jane Doe"
    },
    workDays: [
        { date: "2025-01-15", startTime: "08:00", endTime: "17:00",
          hoursWorked: 8.5, breakHours: 0.5, notes: "" }
    ],
    borings: [
        { boringNumber: "B-1", depth: 45.5, type: "Auger", notes: "" }
    ],
    equipment: [
        { name: "Drill Rig", hours: 8.5, notes: "" }
    ],
    supplies: [
        { item: "Bentonite", quantity: 50, unit: "Bags", notes: "" }
    ],
    savedAt: "2025-01-15T10:30:00.000Z"
}
```

### Error Handling
- Always show user-friendly error messages
- Log detailed errors to console for debugging
- Handle Drive API failures gracefully
- Validate data before CSV generation
- Confirm before overwriting in edit mode

## Testing Checklist

- [ ] CSV generation works with all field types
- [ ] CSV is readable in Excel
- [ ] CSV uploads to Drive alongside JSON
- [ ] Download CSV button works
- [ ] Edit button opens Report app in new tab
- [ ] Report data loads correctly in edit mode
- [ ] All form fields are editable
- [ ] Update button replaces old files (not creates new ones)
- [ ] Dashboard reflects changes after update
- [ ] Both JSON and CSV are overwritten
- [ ] Confirmation dialog appears before update
- [ ] Success message shows after update

## Files to Modify

1. `report/app.js` - Add CSV generation, download button, edit mode, update logic
2. `dashboard/dashboard-app.js` - Change View to Edit button, add navigation
3. `shared/services/googleDrive.js` - Add updateFile method
4. `shared/hooks/useGoogleDrive.js` - Expose updateFile in hook

## GitHub Repository
After implementation, commit with message:
```
Add CSV backup export and report edit functionality

Features:
- Multi-section CSV backup generation and upload
- CSV download button for local backup
- Edit mode: Dashboard can open reports for editing in Report app
- Update functionality: Edited reports overwrite existing files
- Maintains JSON + CSV pairing with same base filename

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Questions for Clarification

If anything is unclear during implementation:
1. CSV formatting: Check example format above
2. File overwrite: Use PATCH method with fileId
3. Edit mode: localStorage for data transfer between apps
4. Button placement: CSV download next to Print, Edit replaces View

## Current Token Usage
Previous session ended at ~48% (96k/200k tokens). Starting fresh will be much faster.
