UI/UX Improvements for Dark Mode and Workflow Selection

The Problem
The application's dashboard experienced several usability and visual consistency issues:
- Poor Dark Mode Contrast: Key labels and instructional text lacked sufficient contrast in dark mode, making them difficult to read.
- Ambiguous Labels: The workflow selection buttons labelled "Option A" and "Option B" were non-descriptive, forcing users to read secondary text to understand functionality.
- Redundancy: The descriptive text below the workflow options merely repeated information that should have been in the headers.
- Visual Misalignment: Differing title lengths caused the two workflow selection cards to be misaligned vertically.
- Cluttered Navigation: Redundant links to the PDF Editor distracted from the primary workflow.

The Solution
A series of UI updates were implemented in page.tsx to enhance clarity and visual polish:

1. Dark Mode Optimization
- Applied dark:text-white utility classes to form labels ("Select Source Table", "Select Your Data Record", "Select PDF Template") and workflow descriptions.
- Updated the main "PDF Generator" title and other headers to ensure bright white text in dark contexts.

2. Workflow Selection Refactoring
- Descriptive Titles: Renamed "Option A" to "Choose a database table and upload your pdf template" and "Option B" to "Upload a CSV/Excel file and your pdf template".
- Redundancy Removal: Deleted the duplicate description paragraphs below the titles since the new headers are self-explanatory.
- Alignment Fix: Added a min-h-[3.5rem] constraint to the workflow titles to ensure both cards maintain equal height and alignment regardless of text wrapping.

3. Interface Cleanup
- Removed the "Open PDF Editor" and "Create/Edit PDF Templates" links to streamline the user interface and focus on the core generation task.
