import * as XLSX from 'xlsx';

// Function to create and save a workbook
function createTemplate(filename, headers, sampleData) {
    const wb = XLSX.utils.book_new();
    const data = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `public/templates/${filename}`);
    console.log(`Created ${filename}`);
}

// Teacher Template
createTemplate(
    'teacher_bulk_upload_template.xlsx',
    ['Name', 'Email', 'Phone Number', 'Employee ID', 'Subjects'],
    [
        ['John Doe', 'john.doe@example.com', '9876543210', 'EMP001', 'Physics, Math'],
        ['Jane Smith', 'jane.smith@example.com', '9876543211', 'EMP002', 'Chemistry, Biology']
    ]
);

// Student Template
createTemplate(
    'student_bulk_upload_template.xlsx',
    ['Name', 'Email', 'Phone Number', 'Batch Code', 'Date of Birth (YYYY-MM-DD)'],
    [
        ['Alice Johnson', 'alice@example.com', '9876543212', 'BATCH-A', '2005-01-15'],
        ['Bob Brown', 'bob@example.com', '9876543213', 'BATCH-B', '2005-05-20']
    ]
);

// Staff Template
createTemplate(
    'staff_bulk_upload_template.xlsx',
    ['Name', 'Email', 'Phone Number'],
    [
        ['Charlie Davis', 'charlie@example.com', '9876543214'],
        ['Diana Evans', 'diana@example.com', '9876543215']
    ]
);
