const fs = require('fs');
const moment = require('moment');
const XLSX = require('xlsx');
const User = require('../models/user'); // Adjust the import according to your user model
const multer = require('multer');
const PDFDocument = require('pdfkit');

// Configure multer for Excel file handling
const storageForExcel = multer.memoryStorage();
const uploadForExcel = multer({ storage: storageForExcel });

// Upload employee data from Excel sheet
exports.uploadExcel = async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        console.log('Uploaded file:', req.file);
        const filePath = req.file.path;

        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            return res.status(400).send('The uploaded Excel file has no sheets.');
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        const processedData = data.map(row => {
            // Format the Dateofjoin
            if (row.Dateofjoin) {
                // Parse the date from Excel and format 
                console.log(row.Dateofjoin)
                row.Dateofjoin = moment(row.Dateofjoin).format('D MMM YYYY');
            } else {
                row.Dateofjoin = null;
            }

            const mobilenumber = row.Mobilenumber;
            row.isValid = mobilenumber && /^\d{10}$/.test(mobilenumber.toString());
            return row;
        });

        const mobileNumbers = processedData
            .map(employee => employee.Mobilenumber)
            .filter(mn => mn !== undefined)
            .map(mn => mn.toString().trim());

        const seenNumbers = new Set();
        const duplicates = new Set();
        const validEmployees = [];
        const invalidEmployees = [];

        for (const employee of processedData) {
            const mobileNumber = employee.Mobilenumber ? employee.Mobilenumber.toString().trim() : null;

            if (!employee.isValid) {
                invalidEmployees.push(employee);
                console.log('Invalid employee due to missing or incorrect mobile number:', employee);
            } else if (seenNumbers.has(mobileNumber)) {
                duplicates.add(mobileNumber);
                invalidEmployees.push(employee);
                console.log('Duplicate employee:', employee);
            } else {
                seenNumbers.add(mobileNumber);
                validEmployees.push(employee);
            }
        }

        const existingEmployees = await User.find({ Mobilenumber: { $in: mobileNumbers } }).exec();
        const existingNumbers = new Set(existingEmployees.map(emp => emp.Mobilenumber));

        const finalValidEmployees = validEmployees.filter(employee => !existingNumbers.has(employee.Mobilenumber));
        const finalInvalidEmployees = [...invalidEmployees, ...validEmployees.filter(employee => existingNumbers.has(employee.Mobilenumber))];

        if (finalValidEmployees.length > 0) {
            const result = await User.insertMany(finalValidEmployees, { ordered: false });
            console.log('Insert result:', result);
        }

        res.json({
            invalidEmployees: finalInvalidEmployees,
            duplicates: Array.from(duplicates),
            insertedCount: finalValidEmployees.length,
            totalRecords: processedData.length,
            errorMessage: finalInvalidEmployees.length > 0 ? 'Some records are invalid, including duplicates' : null
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

//Function to download saved employee data from DB
exports.downloadEmpl = async (req, res) => {
    try {
        const employees = await User.find();

        const doc = new PDFDocument();

        res.setHeader('Content-Disposition', 'attachment; filename=employees.pdf');
        res.setHeader('Content-Type', 'application/pdf');

        doc.pipe(res);

        doc.fontSize(18).text('Employee List', { align: 'center' });
        doc.moveDown();

        employees.forEach((employee, index) => {
            doc.fontSize(12).text(
                `${index + 1}. Name: ${employee.Name}\n` +
                `   Mobile Number: ${employee.Mobilenumber}\n` +
                `   Date of Join: ${employee.Dateofjoin}\n` +
                `   Department: ${employee.Department}\n`
            );
        });

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Internal Server Error');
    }
};
