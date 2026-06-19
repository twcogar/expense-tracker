var ArticleService = (function() {
  function list(filters) {
    AuthService.requireViewer();
    filters = filters || {};
    var query = String(filters.query || '').trim().toLowerCase();
    var type = String(filters.type || '');
    var system = String(filters.system || '');
    var status = String(filters.status || '');
    var includeArchived = Boolean(filters.includeArchived);
    return all_()
      .filter(function(article) {
        if (!includeArchived && String(article.IsArchived).toUpperCase() === 'TRUE') return false;
        if (type && article.Type !== type) return false;
        if (system && article.System !== system) return false;
        if (status && article.Status !== status) return false;
        if (query) {
          var corpus = [article.ArticleID, article.Type, article.Title, article.System, article.Status, article.Audience, article.Owner, article.Summary, article.Tags].join(' ').toLowerCase();
          if (corpus.indexOf(query) === -1) return false;
        }
        return true;
      })
      .map(toClient_)
      .sort(function(a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); });
  }

  function create(payload) {
    var actor = AuthService.requireEditor();
    var article = Validator.article(payload, true);
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var now = new Date();
      var settings = SettingsService.getAll();
      var record = {
        ArticleID: nextId_(article.Type),
        Type: article.Type,
        Title: article.Title,
        System: article.System,
        Status: article.Status,
        Audience: article.Audience,
        Owner: article.Owner,
        Summary: article.Summary,
        Tags: article.Tags,
        SourceReference: article.SourceReference,
        ProcedureNotes: article.ProcedureNotes,
        LastReviewed: article.Status === 'Approved' ? now : article.LastReviewed,
        NextReview: article.Status === 'Approved' ? nextReview_(now, settings.ReviewDays) : article.NextReview,
        UpdatedAt: now,
        UpdatedBy: actor.email,
        CreatedAt: now,
        CreatedBy: actor.email,
        Revision: 1,
        IsArchived: 'FALSE'
      };
      Repository.appendObject(CFKH.SHEETS.ARTICLES, CFKH.ARTICLE_HEADERS, record);
      AuditService.write('CREATE', record.ArticleID, {}, record, 'Created as ' + record.Status);
      return toClient_(record);
    } finally {
      lock.releaseLock();
    }
  }

  function update(articleId, patch) {
    var actor = AuthService.requireEditor();
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var existing = find_(articleId);
      if (!existing) throw new Error('Article not found.');
      var changes = Validator.patch(patch || {});
      var before = clone_(existing);
      Object.keys(changes).forEach(function(key) { existing[key] = changes[key]; });
      existing.UpdatedAt = new Date();
      existing.UpdatedBy = actor.email;
      existing.Revision = Number(existing.Revision || 0) + 1;
      applyReviewDates_(existing);
      Repository.updateObject(CFKH.SHEETS.ARTICLES, CFKH.ARTICLE_HEADERS, existing._row, existing);
      AuditService.write('UPDATE', articleId, before, existing, 'Metadata updated');
      return toClient_(existing);
    } finally {
      lock.releaseLock();
    }
  }

  function transition(articleId, nextStatus, note) {
    var actor = AuthService.requireEditor();
    if (CFKH.STATUSES.indexOf(nextStatus) === -1) throw new Error('Unsupported lifecycle status.');
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var existing = find_(articleId);
      if (!existing) throw new Error('Article not found.');
      var before = clone_(existing);
      existing.Status = nextStatus;
      existing.UpdatedAt = new Date();
      existing.UpdatedBy = actor.email;
      existing.Revision = Number(existing.Revision || 0) + 1;
      applyReviewDates_(existing);
      Repository.updateObject(CFKH.SHEETS.ARTICLES, CFKH.ARTICLE_HEADERS, existing._row, existing);
      AuditService.write('TRANSITION', articleId, before, existing, note || ('Moved to ' + nextStatus));
      return toClient_(existing);
    } finally {
      lock.releaseLock();
    }
  }

  function archive(articleId, note) {
    var actor = AuthService.requireEditor();
    var existing = find_(articleId);
    if (!existing) throw new Error('Article not found.');
    var before = clone_(existing);
    existing.Status = 'Archived';
    existing.IsArchived = 'TRUE';
    existing.UpdatedAt = new Date();
    existing.UpdatedBy = actor.email;
    existing.Revision = Number(existing.Revision || 0) + 1;
    Repository.updateObject(CFKH.SHEETS.ARTICLES, CFKH.ARTICLE_HEADERS, existing._row, existing);
    AuditService.write('ARCHIVE', articleId, before, existing, note || 'Archived');
    return toClient_(existing);
  }

  function getReviewQueue() {
    return list({}).filter(function(article) { return article.status === 'In Review' || article.status === 'Needs Review'; });
  }

  function seed_(records, actor) {
    var existingIds = all_().map(function(row) { return row.ArticleID; });
    records.forEach(function(record) {
      if (existingIds.indexOf(record.ArticleID) === -1) {
        record.CreatedAt = record.CreatedAt || new Date();
        record.CreatedBy = record.CreatedBy || actor;
        record.UpdatedAt = record.UpdatedAt || new Date();
        record.UpdatedBy = record.UpdatedBy || actor;
        record.Revision = record.Revision || 1;
        record.IsArchived = record.IsArchived || 'FALSE';
        Repository.appendObject(CFKH.SHEETS.ARTICLES, CFKH.ARTICLE_HEADERS, record);
      }
    });
  }

  function all_() {
    return Repository.rowsAsObjects(CFKH.SHEETS.ARTICLES, CFKH.ARTICLE_HEADERS);
  }

  function find_(articleId) {
    return all_().filter(function(row) { return row.ArticleID === articleId; })[0] || null;
  }

  function nextId_(type) {
    var prefix = ({
      'SOP': 'CF-SOP',
      'Troubleshooting Guide': 'CF-TG',
      'Knowledge Article': 'CF-KB',
      'Governance Standard': 'CF-GOV',
      'Known Error': 'CF-KE',
      'Service Request': 'CF-SR'
    })[type] || 'CF-KB';
    var max = 0;
    all_().forEach(function(row) {
      if (String(row.ArticleID).indexOf(prefix + '-') === 0) {
        max = Math.max(max, Number(String(row.ArticleID).split('-').pop()) || 0);
      }
    });
    return prefix + '-' + String(max + 1).padStart(3, '0');
  }

  function nextReview_(date, reviewDays) {
    var next = new Date(date);
    next.setDate(next.getDate() + Number(reviewDays || 180));
    return next;
  }

  function applyReviewDates_(record) {
    if (record.Status === 'Approved') {
      if (!record.LastReviewed) record.LastReviewed = new Date();
      if (!record.NextReview) record.NextReview = nextReview_(new Date(), SettingsService.getAll().ReviewDays);
    }
  }

  function toClient_(record) {
    return {
      id: record.ArticleID,
      type: record.Type,
      title: record.Title,
      system: record.System,
      status: record.Status,
      audience: record.Audience,
      owner: record.Owner,
      summary: record.Summary,
      tags: String(record.Tags || '').split(',').map(function(tag) { return tag.trim(); }).filter(Boolean),
      sourceReference: record.SourceReference,
      procedureNotes: record.ProcedureNotes,
      lastReviewed: record.LastReviewed,
      nextReview: record.NextReview,
      updatedAt: record.UpdatedAt,
      updatedBy: record.UpdatedBy,
      createdAt: record.CreatedAt,
      createdBy: record.CreatedBy,
      revision: Number(record.Revision || 1),
      isArchived: String(record.IsArchived).toUpperCase() === 'TRUE'
    };
  }

  function clone_(value) { return JSON.parse(JSON.stringify(value)); }

  return { list: list, create: create, update: update, transition: transition, archive: archive, getReviewQueue: getReviewQueue, seed_: seed_ };
})();
