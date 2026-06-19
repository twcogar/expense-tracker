var AuditService = (function() {
  function write(action, articleId, before, after, note) {
    var actor = AuthService.getUser().email || 'system';
    Repository.appendObject(CFKH.SHEETS.AUDIT, CFKH.AUDIT_HEADERS, {
      Timestamp: new Date(),
      Actor: actor,
      Action: action,
      ArticleID: articleId || '',
      Before: JSON.stringify(before || {}),
      After: JSON.stringify(after || {}),
      Note: note || ''
    });
  }

  function list(articleId) {
    AuthService.requireViewer();
    return Repository.rowsAsObjects(CFKH.SHEETS.AUDIT, CFKH.AUDIT_HEADERS)
      .filter(function(row) { return !articleId || row.ArticleID === articleId; })
      .sort(function(a, b) { return String(b.Timestamp).localeCompare(String(a.Timestamp)); });
  }

  return { write: write, list: list };
})();
