const XLSX = require('xlsx');
const User = require('../models/user'); // Adjust the import according to your user model
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure multer for Excel file handling
const storageForExcel = multer.memoryStorage();
const uploadForExcel = multer({ storage: storageForExcel });

// Function to convert Excel serial date to JavaScript date
const excelSerialDateToJSDate = (serial) => {
    const epoch = new Date(Date.UTC(1899, 11, 30)); // Excel's epoch start date
    return new Date(epoch.getTime() + serial * 86400000);
};

// Function to format date
const formatDate = (dateInput) => {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
};

// Upload employee data from Excel sheet
exports.uploadExcel = uploadForExcel.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const processedData = data.map(row => {
            if (row.Dateofjoin) {
                const serialDate = row.Dateofjoin;
                const date = excelSerialDateToJSDate(serialDate);
                row.Dateofjoin = formatDate(date.toISOString());
            }
            row.isValid = row.Mobilenumber && row.Mobilenumber.toString().length === 10;
            return row;
        });

        const mobileNumbers = processedData.map(employee => employee.Mobilenumber);
        const seenNumbers = new Set();
        const duplicates = new Set();
        const validEmployees = [];
        const invalidEmployees = [];

        for (const employee of processedData) {
            if (!employee.isValid) {
                invalidEmployees.push(employee);
            } else if (seenNumbers.has(employee.Mobilenumber)) {
                duplicates.add(employee.Mobilenumber);
                invalidEmployees.push(employee);
            } else {
                seenNumbers.add(employee.Mobilenumber);
                validEmployees.push(employee);
            }
        }

        const existingEmployees = await User.find({ Mobilenumber: { $in: mobileNumbers } }).exec();
        const existingNumbers = new Set(existingEmployees.map(emp => emp.Mobilenumber));

        const finalValidEmployees = [];
        const finalInvalidEmployees = [];

        for (const employee of validEmployees) {
            if (existingNumbers.has(employee.Mobilenumber)) {
                finalInvalidEmployees.push(employee);
            } else {
                finalValidEmployees.push(employee);
            }
        }

        if (finalValidEmployees.length > 0) {
            await User.insertMany(finalValidEmployees, { ordered: false });
        }

        const combinedInvalidEmployees = [...invalidEmployees, ...finalInvalidEmployees];

        res.json({
            invalidEmployees: combinedInvalidEmployees,
            duplicates: Array.from(duplicates),
            insertedCount: finalValidEmployees.length,
            totalRecords: processedData.length,
            errorMessage: combinedInvalidEmployees.length > 0 ? 'Some records are invalid, including duplicates' : null
        });

    } catch (error) {
        res.status(500).send('Error processing file: ' + error.message);
    }
};

// Function to export employee data to Excel
exports.exportEmployees = async (req, res) => {
    try {
        const employees = await User.find().lean();

        const filteredEmployees = employees.map(({ Name, Mobilenumber, Dateofjoin, Photo, Department }) => ({
            Name,
            'Mobile Number': Mobilenumber,
            'Date of Join': Dateofjoin,
            Photo,
            Department
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(filteredEmployees, {
            header: ['Name', 'Mobile Number', 'Date of Join', 'Photo', 'Department'],
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

        res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).send('Error exporting data');
    }
};
