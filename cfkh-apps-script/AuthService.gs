var AuthService = (function() {
  function getUser() {
    var email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
    var settings = SettingsService.getAll();
    var props = getScriptProperties();
    var admins = csv_(props.getProperty(CFKH.PROPERTY_ADMIN_EMAILS));
    var editors = csv_(props.getProperty(CFKH.PROPERTY_EDITOR_EMAILS));
    var domain = String(settings.AllowedDomain || '').trim().toLowerCase().replace(/^@/, '');
    var authenticated = Boolean(email);
    var domainAllowed = !domain || (email && email.split('@').pop() === domain);
    var allowed = authenticated && domainAllowed;
    return {
      email: email,
      authenticated: authenticated,
      accessAllowed: allowed,
      isAdmin: allowed && admins.indexOf(email) !== -1,
      isEditor: allowed && (admins.indexOf(email) !== -1 || editors.indexOf(email) !== -1),
      displayName: email ? email.split('@')[0] : 'Unauthenticated user'
    };
  }
  function requireViewer() { var user = getUser(); if (!user.accessAllowed) throw new Error('An authenticated district identity is required.'); return user; }
  function requireEditor() { var user = requireViewer(); if (!user.isEditor) throw new Error('Editor access is required.'); return user; }
  function requireAdmin() { var user = requireViewer(); if (!user.isAdmin) throw new Error('Administrator access is required.'); return user; }
  function csv_(value) { return String(value || '').split(',').map(function(v) { return v.trim().toLowerCase(); }).filter(Boolean); }
  return { getUser: getUser, requireViewer: requireViewer, requireEditor: requireEditor, requireAdmin: requireAdmin };
})();