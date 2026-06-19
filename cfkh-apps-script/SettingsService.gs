var SettingsService = (function() {
  var HEADERS = ['Key', 'Value', 'UpdatedAt', 'UpdatedBy'];

  function getAll() {
    var rows = Repository.rowsAsObjects(CFKH.SHEETS.SETTINGS, HEADERS);
    var settings = {};
    Object.keys(CFKH.DEFAULT_SETTINGS).forEach(function(key) { settings[key] = CFKH.DEFAULT_SETTINGS[key]; });
    rows.forEach(function(row) { settings[row.Key] = row.Value; });
    return settings;
  }

  function getClientSettings() {
    AuthService.requireViewer();
    var settings = getAll();
    return {
      appTitle: settings.AppTitle,
      reviewDays: Number(settings.ReviewDays || 180),
      defaultAudience: settings.DefaultAudience,
      defaultOwner: settings.DefaultOwner,
      allowedDomainConfigured: Boolean(settings.AllowedDomain),
      bannerConfigured: Boolean(settings.BannerFileId || getScriptProperties().getProperty(CFKH.PROPERTY_BANNER_FILE_ID))
    };
  }

  function update(patch) {
    var actor = AuthService.requireAdmin();
    var current = getAll();
    Object.keys(patch).forEach(function(key) {
      if (Object.prototype.hasOwnProperty.call(CFKH.DEFAULT_SETTINGS, key)) current[key] = String(patch[key]);
    });
    writeAll_(current, actor.email);
    AuditService.write('SETTINGS_UPDATE', '', {}, patch, 'Settings updated');
    return getClientSettings();
  }

  function writeAll_(settings, actor) {
    var sheet = Repository.ensureSheet(CFKH.SHEETS.SETTINGS, HEADERS);
    var rows = Object.keys(settings).sort().map(function(key) { return [key, settings[key], new Date(), actor]; });
    sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), HEADERS.length).clearContent();
    if (rows.length) sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  }

  function seedDefaults_(actor) {
    var sheet = Repository.ensureSheet(CFKH.SHEETS.SETTINGS, HEADERS);
    if (sheet.getLastRow() > 1) return;
    writeAll_(CFKH.DEFAULT_SETTINGS, actor || 'system');
  }

  return { getAll: getAll, getClientSettings: getClientSettings, update: update, seedDefaults_: seedDefaults_ };
})();
