const XLSX = require('xlsx');

// Function to read data from an Excel file
const readExcelFile = (buffer) => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet); // Convert to JSON
};

// Function to create a workbook from JSON data
const createExcelFile = (data, filename) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    return {
        buffer,
        filename: `${filename}.xlsx`
    };
};

module.exports = {
    readExcelFile,
    createExcelFile
};
