var Validator = (function() {
  function article(payload, isCreate) {
    var result = normalize_(payload);
    var errors = [];
    if (!result.Type || CFKH.TYPES.indexOf(result.Type) === -1) errors.push('A supported content type is required.');
    if (!result.Title) errors.push('A title is required.');
    if (!result.System || CFKH.SYSTEMS.indexOf(result.System) === -1) errors.push('A supported system is required.');
    if (!result.Status || CFKH.STATUSES.indexOf(result.Status) === -1) errors.push('A supported lifecycle status is required.');
    if (!result.Summary) errors.push('A purpose or summary is required.');
    if (errors.length) throw new Error(errors.join(' '));
    return result;
  }

  function patch(payload) {
    var allowed = [
      'Type', 'Title', 'System', 'Status', 'Audience', 'Owner', 'Summary', 'Tags',
      'SourceReference', 'ProcedureNotes', 'LastReviewed', 'NextReview'
    ];
    var patch = {};
    allowed.forEach(function(key) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) patch[key] = normalizeValue_(payload[key]);
    });
    if (patch.Type && CFKH.TYPES.indexOf(patch.Type) === -1) throw new Error('Unsupported content type.');
    if (patch.System && CFKH.SYSTEMS.indexOf(patch.System) === -1) throw new Error('Unsupported system.');
    if (patch.Status && CFKH.STATUSES.indexOf(patch.Status) === -1) throw new Error('Unsupported lifecycle status.');
    return patch;
  }

  function normalize_(payload) {
    var settings = SettingsService.getAll();
    return {
      Type: normalizeValue_(payload.Type || payload.type || 'Knowledge Article'),
      Title: normalizeValue_(payload.Title || payload.title),
      System: normalizeValue_(payload.System || payload.system || 'Lightspeed Filter'),
      Status: normalizeValue_(payload.Status || payload.status || 'Draft'),
      Audience: normalizeValue_(payload.Audience || payload.audience || settings.DefaultAudience),
      Owner: normalizeValue_(payload.Owner || payload.owner || settings.DefaultOwner),
      Summary: normalizeValue_(payload.Summary || payload.summary),
      Tags: normalizeTags_(payload.Tags || payload.tags),
      SourceReference: normalizeValue_(payload.SourceReference || payload.sourceReference),
      ProcedureNotes: normalizeValue_(payload.ProcedureNotes || payload.procedureNotes),
      LastReviewed: normalizeValue_(payload.LastReviewed || payload.lastReviewed),
      NextReview: normalizeValue_(payload.NextReview || payload.nextReview)
    };
  }

  function normalizeTags_(value) {
    var tags = Array.isArray(value) ? value : String(value || '').split(',');
    return tags.map(function(tag) { return normalizeValue_(tag); }).filter(Boolean).slice(0, 12).join(', ');
  }

  function normalizeValue_(value) {
    return String(value === undefined || value === null ? '' : value).trim();
  }

  return { article: article, patch: patch };
})();
