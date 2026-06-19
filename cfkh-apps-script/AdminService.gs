var AdminService = (function() {
  function configureAccess(config) {
    var actor = AuthService.requireAdmin();
    config = config || {};
    var props = getScriptProperties();
    if (Object.prototype.hasOwnProperty.call(config, 'adminEmails')) {
      props.setProperty(CFKH.PROPERTY_ADMIN_EMAILS, normalizeEmails_(config.adminEmails));
    }
    if (Object.prototype.hasOwnProperty.call(config, 'editorEmails')) {
      props.setProperty(CFKH.PROPERTY_EDITOR_EMAILS, normalizeEmails_(config.editorEmails));
    }
    if (Object.prototype.hasOwnProperty.call(config, 'allowedDomain')) {
      SettingsService.update({ AllowedDomain: String(config.allowedDomain || '').replace(/^@/, '').trim().toLowerCase() });
    }
    AuditService.write('ACCESS_CONFIGURATION', '', {}, config, 'Access configuration changed by ' + actor.email);
    return getAccessSummary();
  }

  function getAccessSummary() {
    AuthService.requireAdmin();
    var props = getScriptProperties();
    return {
      adminEmails: props.getProperty(CFKH.PROPERTY_ADMIN_EMAILS) || '',
      editorEmails: props.getProperty(CFKH.PROPERTY_EDITOR_EMAILS) || '',
      allowedDomain: SettingsService.getAll().AllowedDomain || ''
    };
  }

  function normalizeEmails_(value) {
    var values = Array.isArray(value) ? value : String(value || '').split(',');
    return values.map(function(email) { return String(email).trim().toLowerCase(); }).filter(Boolean).join(',');
  }

  return { configureAccess: configureAccess, getAccessSummary: getAccessSummary };
})();
