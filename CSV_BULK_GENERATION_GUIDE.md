# CSV/Excel Bulk PDF Generation Feature

## Overview
This feature allows you to upload a CSV or Excel file and automatically generate multiple PDFs with the same template but different data from each row.

## How It Works

### 1. Upload Your PDF Template
- Go to the PDF Editor page
- Select or create a template
- Upload your PDF template file

### 2. Upload CSV/Excel File
- In the "📊 CSV/Excel Import for Bulk Generation" section
- Click the file input and select your CSV or Excel file (.csv, .xlsx, .xls)
- The system will read the file and display:
  - Filename
  - Number of records found
  - Available column headers

### 3. Map Columns to PDF
- Once uploaded, you'll see all the column headers from your CSV/Excel file
- Click on any column to add it to your PDF template
- Each click adds a new field that can be positioned on the PDF
- You can add the same column multiple times if needed

### 4. Position Fields
- Click on the PDF preview where you want each field to appear
- Drag and drop fields to reposition them
- Configure font size, font family, and other properties
- Fields from CSV columns will show as "csv_{columnName}"

### 5. Generate Bulk PDFs
- Click the "📚 Bulk Generate" button
- The system will create a single PDF file containing:
  - One page (or set of pages) for each row in your CSV/Excel
  - Same layout and positioning
  - Different data from each row

### 6. Download
- The bulk PDF will automatically download
- Each record from your CSV/Excel becomes a separate page in the PDF

## Example Use Case

**CSV File (sample_bulk_data.csv):**
```csv
Name,Email,Phone,Address,City
John Doe,john@example.com,555-0101,123 Main St,New York
Jane Smith,jane@example.com,555-0102,456 Oak Ave,Los Angeles
```

**Steps:**
1. Upload a certificate template PDF
2. Upload the sample_bulk_data.csv file
3. Click "Name" column → position it on the PDF
4. Click "Email" column → position it on the PDF
5. Click "Phone" column → position it on the PDF
6. Click "📚 Bulk Generate"
7. Download a PDF with 2 certificates (one for John, one for Jane)

## Features

### Supported File Types
- CSV (.csv)
- Excel 2007+ (.xlsx)
- Excel 97-2003 (.xls)

### Column Management
- Automatic column detection from first row
- Click any column multiple times to add duplicate fields
- Visual column buttons with emoji indicators
- Remove uploaded file to start over

### PDF Generation
- Maintains exact positioning across all records
- Supports multi-page PDF templates
- Preserves fonts, sizes, and styling
- Automatic file naming with timestamp

## Technical Details

### Backend Components
- **DataImport Model**: Stores CSV/Excel metadata
- **DataImportController**: Handles file upload and retrieval
- **PdfTemplateController::generateBulk()**: Creates bulk PDFs
- **Laravel Excel Package**: Processes CSV/Excel files
- **FPDI Library**: Manipulates PDF templates

### Frontend Components
- CSV upload input with validation
- Column display and click handlers
- Bulk generate button
- File metadata display

### Database Schema
```sql
data_imports:
  - id
  - pdf_template_id (foreign key)
  - filename
  - file_path
  - columns (JSON array)
  - total_rows
  - created_at
  - updated_at
```

### Field Configuration
Fields from CSV columns include:
```json
{
  "csv_columnName": {
    "x": 100,
    "y": 150,
    "page": 1,
    "font": "Arial",
    "size": 12,
    "csv_column": "columnName",
    "csv_index": 0
  }
}
```

## API Endpoints

### Upload CSV/Excel
```
POST /templates/{template}/import
Content-Type: multipart/form-data
Body: file (CSV/Excel file)
```

### Get Import Data
```
GET /templates/{template}/import/data
Response: { columns: [], data: [], total_rows: 0 }
```

### Delete Import
```
DELETE /templates/{template}/import
```

### Generate Bulk PDFs
```
POST /templates/{template}/generate-bulk
Response: PDF file download
```

## Limitations

- Maximum file size: 10MB
- CSV/Excel files must have headers in the first row
- One import file per template (uploading new file replaces old one)
- Generated PDFs are temporary and deleted after download

## Tips

1. **Test First**: Try with a small CSV (2-3 rows) before bulk generation
2. **Clean Data**: Ensure your CSV has no empty header columns
3. **Preview**: Always preview your template before bulk generation
4. **Save Template**: Save your template after positioning all fields
5. **Field Names**: CSV fields are prefixed with "csv_" for easy identification

## Troubleshooting

**Upload fails:**
- Check file format (.csv, .xlsx, .xls only)
- Ensure file size is under 10MB
- Verify file has headers in first row

**Missing columns:**
- Make sure first row contains column headers
- Check for empty or duplicate column names
- Verify file encoding (UTF-8 recommended)

**Generation fails:**
- Save template before generating
- Ensure PDF template is uploaded
- Check that CSV import is still active

## Sample Files

A sample CSV file is included: `sample_bulk_data.csv`

Use this to test the feature with:
- 10 sample records
- 5 columns (Name, Email, Phone, Address, City)
- Realistic test data
