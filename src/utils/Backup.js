// Function to convert Excel serial date to JavaScript date
function excelSerialDateToJSDate(serial) {
    const excelEpoch = new Date(1900, 0, 1); // Excel's epoch starts on January 1, 1900
    const daysSinceEpoch = serial - 1; // Subtract 1 because Excel's date starts at 1
    return new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
}

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