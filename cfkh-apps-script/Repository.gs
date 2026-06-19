var Repository = (function() {
  function getSpreadsheet() {
    var props = getScriptProperties();
    var id = props.getProperty(CFKH.PROPERTY_SPREADSHEET_ID);
    if (id) return SpreadsheetApp.openById(id);
    var created = SpreadsheetApp.create(CFKH.APP_NAME + ' — Data');
    props.setProperty(CFKH.PROPERTY_SPREADSHEET_ID, created.getId());
    return created;
  }

  function ensureSheet(name, headers) {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sheet.getLastRow() === 0 && headers && headers.length) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#165788')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
      sheet.autoResizeColumns(1, headers.length);
    }
    return sheet;
  }

  function rowsAsObjects(sheetName, headers) {
    var sheet = ensureSheet(sheetName, headers);
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];
    var columns = values[0];
    return values.slice(1).filter(function(row) { return row.some(function(value) { return value !== ''; }); })
      .map(function(row, index) {
        var result = { _row: index + 2 };
        columns.forEach(function(column, colIndex) { result[column] = serialize_(row[colIndex]); });
        return result;
      });
  }

  function appendObject(sheetName, headers, object) {
    var sheet = ensureSheet(sheetName, headers);
    var row = headers.map(function(header) { return object[header] === undefined ? '' : object[header]; });
    sheet.appendRow(row);
    return sheet.getLastRow();
  }

  function updateObject(sheetName, headers, rowNumber, object) {
    var sheet = ensureSheet(sheetName, headers);
    var row = headers.map(function(header) { return object[header] === undefined ? '' : object[header]; });
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
  }

  function serialize_(value) {
    if (Object.prototype.toString.call(value) === '[object Date]') {
      return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
    }
    return value;
  }

  return { getSpreadsheet: getSpreadsheet, ensureSheet: ensureSheet, rowsAsObjects: rowsAsObjects, appendObject: appendObject, updateObject: updateObject };
})();
