var AuthService = (function() {
  function getUser() {
    var active = Session.getActiveUser().getEmail();
    var effective = Session.getEffectiveUser().getEmail();
    var email = String(active || effective || '').trim().toLowerCase();
    var config = SettingsService.getAll();
    var props = getScriptProperties();
    var admins = csv_(props.getProperty(CFKH.PROPERTY_ADMIN_EMAILS));
    var editors = csv_(props.getProperty(CFKH.PROPERTY_EDITOR_EMAILS));
    var allowedDomain = String(config.AllowedDomain || '').trim().toLowerCase().replace(/^@/, '');
    var isAdmin = admins.indexOf(email) !== -1 || (!admins.length && email === String(effective || '').toLowerCase());
    var isEditor = isAdmin || editors.indexOf(email) !== -1;
    var authenticated = Boolean(email);
    var domainAllowed = !allowedDomain || (email && email.split('@').pop() === allowedDomain);
    var accessAllowed = authenticated && domainAllowed;
    return {
      email: email,
      authenticated: authenticated,
      accessAllowed: accessAllowed,
      isAdmin: isAdmin,
      isEditor: isEditor,
      displayName: email ? email.split('@')[0] : 'Unknown user'
    };
  }

  function requireViewer() {
    var user = getUser();
    if (!user.accessAllowed) {
      throw new Error('Access denied. Deploy this web app for authenticated district users and configure the AllowedDomain setting.');
    }
    return user;
  }

  function requireEditor() {
    var user = requireViewer();
    if (!user.isEditor) throw new Error('Editor access is required for this action.');
    return user;
  }

  function requireAdmin() {
    var user = requireViewer();
    if (!user.isAdmin) throw new Error('Administrator access is required for this action.');
    return user;
  }

  function csv_(value) {
    return String(value || '').split(',').map(function(v) { return v.trim().toLowerCase(); }).filter(Boolean);
  }

  return { getUser: getUser, requireViewer: requireViewer, requireEditor: requireEditor, requireAdmin: requireAdmin };
})();
