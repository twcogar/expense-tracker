var BootstrapService = (function() {
  function setup() {
    var ss = Repository.getSpreadsheet();
    Repository.ensureSheet(CFKH.SHEETS.ARTICLES, CFKH.ARTICLE_HEADERS);
    Repository.ensureSheet(CFKH.SHEETS.SETTINGS, ['Key', 'Value', 'UpdatedAt', 'UpdatedBy']);
    Repository.ensureSheet(CFKH.SHEETS.AUDIT, CFKH.AUDIT_HEADERS);

    var actor = Session.getEffectiveUser().getEmail() || 'system';
    SettingsService.seedDefaults_(actor);
    var props = getScriptProperties();
    if (!props.getProperty(CFKH.PROPERTY_ADMIN_EMAILS) && actor.indexOf('@') !== -1) {
      props.setProperty(CFKH.PROPERTY_ADMIN_EMAILS, actor.toLowerCase());
    }
    SeedData.seed(actor);
    return {
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl(),
      sheets: [CFKH.SHEETS.ARTICLES, CFKH.SHEETS.SETTINGS, CFKH.SHEETS.AUDIT]
    };
  }

  return { setup: setup };
})();

function bootstrapKnowledgeHub_() {
  BootstrapService.setup();
}
